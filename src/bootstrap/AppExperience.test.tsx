import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';

import App from '../../App';
import type { WeatherLocation, WeatherProvider, WeatherReport } from '../domain/weather';
import { ASSISTANT_REPLIES } from '../features/assistant/assistantPreview';
import { PROVIDER_PRESENTATIONS } from '../presentation/providers';
import { createApplication } from './createApplication';

jest.mock('./createApplication', () => ({ createApplication: jest.fn() }));
jest.mock('../platform/queryLifecycle', () => ({ connectQueryLifecycle: () => () => {} }));
jest.mock('../presentation/WeatherScene', () => ({ WeatherScene: () => null }));
jest.mock('@expo/vector-icons/Feather', () => {
  const { createElement } = jest.requireActual<typeof ReactModule>('react');
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return ({ name }: { readonly name: string }) => createElement(View, { testID: `icon-${name}` });
});
jest.mock('react-native-safe-area-context', () => {
  const { createElement, Fragment } = jest.requireActual<typeof ReactModule>('react');
  return {
    SafeAreaProvider: ({ children }: ReactModule.PropsWithChildren) =>
      createElement(Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});
jest.mock('expo-status-bar', () => {
  const { createElement } = jest.requireActual<typeof ReactModule>('react');
  const { Text } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return {
    StatusBar: ({ style }: { readonly style: string }) =>
      createElement(Text, null, `${style} status bar`),
  };
});

const clients: QueryClient[] = [];

function report(
  providerId: string,
  location: WeatherLocation,
  temperatureCelsius: number,
): WeatherReport {
  return {
    providerId,
    location,
    temperatureCelsius,
    timestamp: '2026-10-26T18:00:00Z',
    feelsLikeCelsius: null,
    humidityPercent: 70,
    windSpeedKmh: 8,
    condition: 'cloudy',
    isDay: false,
    hourly: [],
    attribution: providerId,
    attributionUrl: 'https://open-meteo.com/',
  };
}

function createTestApplication() {
  const first = {
    id: 'open-meteo',
    getWeather: jest
      .fn<ReturnType<WeatherProvider['getWeather']>, Parameters<WeatherProvider['getWeather']>>()
      .mockImplementation(async (location) => report('open-meteo', location, 21)),
  };
  const second = {
    id: 'met-norway',
    getWeather: jest
      .fn<ReturnType<WeatherProvider['getWeather']>, Parameters<WeatherProvider['getWeather']>>()
      .mockImplementation(async (location) => report('met-norway', location, 18)),
  };
  const providers = new Map<string, WeatherProvider>([
    [first.id, first],
    [second.id, second],
  ]);
  const search = jest.fn().mockResolvedValue([]);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  clients.push(client);
  jest.mocked(createApplication).mockReturnValue({
    weather: { providers, initialProviderId: first.id, locationSearch: { search } },
    catalog: { providers, presentations: PROVIDER_PRESENTATIONS, defaultProviderId: first.id },
    queryClient: client,
  });
  return { first, second, search };
}

beforeEach(() => {
  jest
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Network calls are forbidden in this integration test.'));
});

afterEach(() => {
  for (const client of clients) client.clear();
  clients.length = 0;
});

describe('appearance and assistant integration', () => {
  it('changes appearance without recreating services, reloading weather, or losing the selected source', async () => {
    const { first, second, search } = createTestApplication();
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Try Tbilisi' }));
    await waitFor(() => expect(screen.getByLabelText('21 degrees Celsius')).toBeOnTheScreen());
    await fireEvent.press(screen.getByRole('button', { name: 'Customize appearance' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Midnight' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close appearance' }));
    expect(screen.getByText('light status bar')).toBeOnTheScreen();
    expect(screen.getByLabelText('21 degrees Celsius')).toBeOnTheScreen();
    expect(first.getWeather).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole('radio', { name: 'MET Norway' }));
    await waitFor(() => expect(screen.getByLabelText('18 degrees Celsius')).toBeOnTheScreen());
    await fireEvent.press(screen.getByRole('button', { name: 'Customize appearance' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Glacier' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close appearance' }));
    expect(screen.getByText('dark status bar')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'MET Norway' })).toBeChecked();
    expect(screen.getByLabelText('18 degrees Celsius')).toBeOnTheScreen();
    expect(first.getWeather).toHaveBeenCalledTimes(1);
    expect(second.getWeather).toHaveBeenCalledTimes(1);
    expect(search).not.toHaveBeenCalled();
    expect(createApplication).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('keeps the local assistant conversation through a theme change without issuing requests', async () => {
    const { first, second } = createTestApplication();
    await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Open Sky assistant, coming soon' }));
    await fireEvent.changeText(screen.getByLabelText('Message Sky'), 'Will I need an umbrella?');
    await fireEvent.press(screen.getByRole('button', { name: 'Send preview message' }));
    expect(screen.getByText(ASSISTANT_REPLIES[0])).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Close Sky assistant' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Customize appearance' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Orchid' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close appearance' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Open Sky assistant, coming soon' }));
    expect(screen.getByText(ASSISTANT_REPLIES[0])).toBeOnTheScreen();
    expect(screen.getByText('Will I need an umbrella?')).toBeOnTheScreen();
    expect(screen.getByText('light status bar', { includeHiddenElements: true })).toBeOnTheScreen();
    expect(first.getWeather).not.toHaveBeenCalled();
    expect(second.getWeather).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(createApplication).toHaveBeenCalledTimes(1);
  });
});
