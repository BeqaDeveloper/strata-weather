import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { WeatherError } from '../domain/errors';
import type {
  LocationSearch,
  WeatherLocation,
  WeatherProvider,
  WeatherReport,
} from '../domain/weather';
import { shouldRetryRequest } from './queryPolicy';
import { useWeatherController } from './useWeatherController';

const tbilisi: WeatherLocation = {
  id: '611717',
  name: 'Tbilisi',
  region: 'Tbilisi',
  country: 'Georgia',
  latitude: 41.6941,
  longitude: 44.8337,
  timezone: 'Asia/Tbilisi',
};

const london: WeatherLocation = {
  id: '2643743',
  name: 'London',
  region: 'England',
  country: 'United Kingdom',
  latitude: 51.5085,
  longitude: -0.1257,
  timezone: 'Europe/London',
};

function report(providerId: string, location = tbilisi, temperatureCelsius = 21): WeatherReport {
  return {
    providerId,
    location,
    timestamp: '2026-10-26T12:00:00.000Z',
    temperatureCelsius,
    feelsLikeCelsius: 20,
    humidityPercent: 60,
    windSpeedKmh: 12,
    condition: 'clear',
    isDay: true,
    hourly: [],
    attribution: providerId,
    attributionUrl: 'https://example.com',
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

const clients: QueryClient[] = [];

async function setup() {
  const first = {
    id: 'open-meteo',
    getWeather: jest
      .fn<ReturnType<WeatherProvider['getWeather']>, Parameters<WeatherProvider['getWeather']>>()
      .mockImplementation(async (location) => report('open-meteo', location)),
  };
  const second = {
    id: 'met-norway',
    getWeather: jest
      .fn<ReturnType<WeatherProvider['getWeather']>, Parameters<WeatherProvider['getWeather']>>()
      .mockImplementation(async (location) => report('met-norway', location, 17)),
  };
  const locationSearch = {
    search: jest
      .fn<ReturnType<LocationSearch['search']>, Parameters<LocationSearch['search']>>()
      .mockResolvedValue([tbilisi]),
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0, gcTime: Infinity } },
  });
  clients.push(client);
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  const dependencies = {
    providers: new Map<string, WeatherProvider>([
      [first.id, first],
      [second.id, second],
    ]),
    locationSearch,
    initialProviderId: first.id,
  };
  const hook = await renderHook(() => useWeatherController(dependencies), { wrapper: Wrapper });
  return { ...hook, first, second, locationSearch };
}

afterEach(() => {
  onlineManager.setOnline(true);
  for (const client of clients) client.clear();
  clients.length = 0;
});

describe('useWeatherController', () => {
  it('keeps weather actions stable while the search input changes', async () => {
    const { result } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather).toBeDefined());
    const previous = result.current;
    await act(() => result.current.onChangeQuery('London'));
    expect(result.current.onRefresh).toBe(previous.onRefresh);
    expect(result.current.onSelectProvider).toBe(previous.onSelectProvider);
    expect(result.current.onSelectLocation).toBe(previous.onSelectLocation);
    expect(result.current.weather).toBe(previous.weather);
  });

  it('explains a paused offline lookup and resumes when connected', async () => {
    const { result, locationSearch } = await setup();
    await act(() => onlineManager.setOnline(false));
    await act(() => result.current.onChangeQuery('Tbilisi'));
    await act(() => result.current.onSearch());
    await waitFor(() => expect(result.current.searchError).toContain('offline'));
    expect(result.current.isSearching).toBe(false);
    expect(locationSearch.search).not.toHaveBeenCalled();
    await act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(result.current.locations).toEqual([tbilisi]));
    expect(result.current.searchError).toBeNull();
  });

  it('shows a paused offline forecast without an endless spinner and recovers', async () => {
    const { result, first } = await setup();
    await act(() => onlineManager.setOnline(false));
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weatherError).toContain('offline'));
    expect(result.current.isLoading).toBe(false);
    expect(first.getWeather).not.toHaveBeenCalled();
    await act(() => result.current.onRefresh());
    expect(first.getWeather).not.toHaveBeenCalled();
    await act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(result.current.weather?.providerId).toBe('open-meteo'));
    expect(result.current.weatherError).toBeNull();
  });

  it('retains the previous report during an offline refresh', async () => {
    const { result } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather).toBeDefined());
    const previous = result.current.weather;
    await act(() => onlineManager.setOnline(false));
    await act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.weatherError).toContain('offline'));
    expect(result.current.weather).toBe(previous);
    expect(result.current.isRefreshing).toBe(false);
    await act(() => onlineManager.setOnline(true));
    await waitFor(() => expect(result.current.weatherError).toBeNull());
  });
  it('starts idle and allows selecting a service before choosing a location', async () => {
    const { result, first, second, locationSearch } = await setup();
    expect(result.current.location).toBeNull();
    expect(result.current.weather).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.validationError).toBeNull();

    await act(() => result.current.onSelectProvider('met-norway'));
    await act(() => result.current.onRefresh());

    expect(result.current.selectedProviderId).toBe('met-norway');
    expect(first.getWeather).not.toHaveBeenCalled();
    expect(second.getWeather).not.toHaveBeenCalled();
    expect(locationSearch.search).not.toHaveBeenCalled();
  });

  it.each(['', '   ', 'a', '<script>alert(1)</script>', 'x'.repeat(81)])(
    'rejects invalid location input %p without making a request',
    async (input) => {
      const { result, locationSearch } = await setup();
      await act(() => result.current.onChangeQuery(input));
      await act(() => result.current.onSearch());

      expect(result.current.validationError).toEqual(expect.any(String));
      expect(result.current.locations).toEqual([]);
      expect(locationSearch.search).not.toHaveBeenCalled();

      await act(() => result.current.onChangeQuery('Tbilisi'));
      expect(result.current.validationError).toBeNull();
    },
  );

  it('normalizes the search and waits for an explicit location selection', async () => {
    const { result, first, locationSearch } = await setup();
    locationSearch.search.mockResolvedValue([tbilisi, london]);
    await act(() => result.current.onChangeQuery('  Tbilisi   Georgia  '));
    await act(() => result.current.onSearch());
    await waitFor(() => expect(result.current.locations).toEqual([tbilisi, london]));

    expect(locationSearch.search).toHaveBeenCalledWith('Tbilisi Georgia', expect.any(AbortSignal));
    expect(first.getWeather).not.toHaveBeenCalled();

    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather?.location).toEqual(tbilisi));
    expect(result.current.query).toBe('Tbilisi, Georgia');
    expect(result.current.locations).toEqual([]);
    expect(result.current.location).toEqual(tbilisi);
  });

  it('automatically fetches the selected service for an already selected location', async () => {
    const { result, first, second } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather?.providerId).toBe('open-meteo'));

    await act(() => result.current.onSelectProvider('met-norway'));
    await waitFor(() => expect(result.current.weather?.providerId).toBe('met-norway'));

    expect(second.getWeather).toHaveBeenCalledWith(tbilisi, expect.any(AbortSignal));
    expect(result.current.weather?.temperatureCelsius).toBe(17);
    expect(first.getWeather).toHaveBeenCalledTimes(1);
  });

  it('refreshes a previously selected service when toggling back', async () => {
    const { result, first } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather?.providerId).toBe('open-meteo'));
    await act(() => result.current.onSelectProvider('met-norway'));
    await waitFor(() => expect(result.current.weather?.providerId).toBe('met-norway'));

    first.getWeather.mockResolvedValue(report('open-meteo', tbilisi, 25));
    await act(() => result.current.onSelectProvider('open-meteo'));
    await waitFor(() => expect(result.current.weather?.temperatureCelsius).toBe(25));

    expect(first.getWeather).toHaveBeenCalledTimes(2);
  });

  it('aborts an outdated provider request and ignores its late response', async () => {
    const { result, first } = await setup();
    const previous = deferred<WeatherReport>();
    first.getWeather.mockReturnValue(previous.promise);
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(first.getWeather).toHaveBeenCalledTimes(1));
    const signal = first.getWeather.mock.calls[0]?.[1];
    expect(result.current.isLoading).toBe(true);

    await act(() => result.current.onSelectProvider('met-norway'));
    await waitFor(() => expect(result.current.weather?.providerId).toBe('met-norway'));
    expect(signal?.aborted).toBe(true);

    await act(() => previous.resolve(report('open-meteo', tbilisi, 99)));
    expect(result.current.weather?.providerId).toBe('met-norway');
    expect(result.current.weather?.temperatureCelsius).toBe(17);
  });

  it('aborts an in-flight forecast when unmounted', async () => {
    const { result, first, unmount } = await setup();
    first.getWeather.mockReturnValue(deferred<WeatherReport>().promise);
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(first.getWeather).toHaveBeenCalledTimes(1));
    const signal = first.getWeather.mock.calls[0]?.[1];

    await unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('cancels location searches as the input changes and hides outdated matches', async () => {
    const { result, locationSearch } = await setup();
    const previous = deferred<readonly WeatherLocation[]>();
    locationSearch.search.mockReturnValue(previous.promise);
    await act(() => result.current.onChangeQuery('Tbilisi'));
    await act(() => result.current.onSearch());
    await waitFor(() => expect(result.current.isSearching).toBe(true));
    const signal = locationSearch.search.mock.calls[0]?.[1];

    await act(() => result.current.onChangeQuery('London'));
    expect(signal?.aborted).toBe(true);
    expect(result.current.locations).toEqual([]);

    await act(() => previous.resolve([tbilisi]));
    expect(result.current.locations).toEqual([]);
    expect(result.current.query).toBe('London');
  });

  it('reports empty results and lets the same search run again', async () => {
    const { result, locationSearch } = await setup();
    locationSearch.search.mockResolvedValueOnce([]);
    await act(() => result.current.onChangeQuery('Unknown city'));
    await act(() => result.current.onSearch());
    await waitFor(() => expect(result.current.searchError).toContain('No locations found'));

    locationSearch.search.mockResolvedValueOnce([tbilisi]);
    await act(() => result.current.onSearch());
    await waitFor(() => expect(result.current.locations).toEqual([tbilisi]));

    expect(result.current.searchError).toBeNull();
    expect(locationSearch.search).toHaveBeenCalledTimes(2);
  });

  it('shows search failures and clears them when a new search begins', async () => {
    const { result, locationSearch } = await setup();
    locationSearch.search.mockRejectedValueOnce(
      new WeatherError('unavailable', 'Search is unavailable.'),
    );
    await act(() => result.current.onChangeQuery('Tbilisi'));
    await act(() => result.current.onSearch());
    await waitFor(() => expect(result.current.searchError).toBe('Search is unavailable.'));

    await act(() => result.current.onChangeQuery('London'));
    expect(result.current.searchError).toBeNull();
    expect(result.current.locations).toEqual([]);
  });

  it('recovers from a forecast failure through an explicit retry', async () => {
    const { result, first } = await setup();
    first.getWeather.mockRejectedValueOnce(
      new WeatherError('unavailable', 'Service is unavailable.'),
    );
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weatherError).toBe('Service is unavailable.'));

    expect(result.current.weather).toBeUndefined();
    await act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.weather?.providerId).toBe('open-meteo'));

    expect(result.current.weatherError).toBeNull();
    expect(first.getWeather).toHaveBeenCalledTimes(2);
  });

  it('keeps the last successful report visible if a refresh fails', async () => {
    const { result, first } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather?.temperatureCelsius).toBe(21));
    first.getWeather.mockRejectedValueOnce(new WeatherError('unavailable', 'Refresh failed.'));

    await act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.weatherError).toBe('Refresh failed.'));

    expect(result.current.weather?.temperatureCelsius).toBe(21);
    expect(result.current.isRefreshing).toBe(false);
  });

  it('refreshes manually and prevents duplicate refresh requests', async () => {
    const { result, first } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather?.temperatureCelsius).toBe(21));
    const refresh = deferred<WeatherReport>();
    first.getWeather.mockReturnValueOnce(refresh.promise);

    await act(() => result.current.onRefresh());
    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    await act(() => result.current.onRefresh());
    expect(first.getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.weather?.temperatureCelsius).toBe(21);

    await act(() => refresh.resolve(report('open-meteo', tbilisi, 23)));
    await waitFor(() => expect(result.current.weather?.temperatureCelsius).toBe(23));
    expect(result.current.isRefreshing).toBe(false);
  });

  it('separates reports by coordinates even if two locations share an identifier', async () => {
    const { result, first } = await setup();
    await act(() => result.current.onSelectLocation(tbilisi));
    await waitFor(() => expect(result.current.weather?.location).toEqual(tbilisi));
    const otherLocation = { ...london, id: tbilisi.id, name: tbilisi.name };

    await act(() => result.current.onSelectLocation(otherLocation));
    await waitFor(() => expect(result.current.weather?.location).toEqual(otherLocation));

    expect(first.getWeather).toHaveBeenCalledTimes(2);
  });

  it('ignores an unregistered service selection', async () => {
    const { result, first, second } = await setup();
    await act(() => result.current.onSelectProvider('removed-service'));
    expect(result.current.selectedProviderId).toBe('open-meteo');
    expect(first.getWeather).not.toHaveBeenCalled();
    expect(second.getWeather).not.toHaveBeenCalled();
  });
});

describe('request retry policy', () => {
  it('allows one retry for transient weather errors', () => {
    const transient = new WeatherError('network', 'Connection lost.', true);
    expect(shouldRetryRequest(0, transient)).toBe(true);
    expect(shouldRetryRequest(1, transient)).toBe(false);
  });

  it('does not retry unexpected or permanent failures', () => {
    expect(shouldRetryRequest(0, new Error('Unexpected failure.'))).toBe(false);
    expect(shouldRetryRequest(0, new WeatherError('invalid-response', 'Invalid response.'))).toBe(
      false,
    );
  });
});
