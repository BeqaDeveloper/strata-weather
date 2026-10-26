import { fireEvent, render, screen } from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';

import type { WeatherLocation, WeatherReport } from '../domain/weather';
import { PROVIDER_PRESENTATIONS } from './providers';
import { WeatherScreen, type WeatherScreenProps } from './WeatherScreen';

jest.mock('@expo/vector-icons/Feather', () => {
  const { createElement } = jest.requireActual<typeof ReactModule>('react');
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return ({ name }: { readonly name: string }) => createElement(View, { testID: `icon-${name}` });
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.setTimeout(15_000);

const location: WeatherLocation = {
  id: '611717',
  name: 'Tbilisi',
  region: 'Tbilisi',
  country: 'Georgia',
  latitude: 41.6941,
  longitude: 44.8337,
  timezone: 'Asia/Tbilisi',
};

const weather: WeatherReport = {
  providerId: 'open-meteo',
  location,
  timestamp: '2026-10-26T12:00:00Z',
  temperatureCelsius: 21,
  feelsLikeCelsius: 20,
  humidityPercent: 55,
  windSpeedKmh: 12,
  condition: 'clear',
  isDay: true,
  hourly: [
    { timestamp: '2026-10-26T13:00:00Z', temperatureCelsius: 20, condition: 'cloudy', isDay: true },
  ],
  attribution: 'Weather data by Open-Meteo',
  attributionUrl: 'https://open-meteo.com/',
};

function createProps(overrides: Partial<WeatherScreenProps> = {}): WeatherScreenProps {
  return {
    providers: PROVIDER_PRESENTATIONS,
    selectedProviderId: 'open-meteo',
    onSelectProvider: jest.fn(),
    query: '',
    onChangeQuery: jest.fn(),
    onSearch: jest.fn(),
    validationError: null,
    locations: [],
    isSearching: false,
    searchError: null,
    onSelectLocation: jest.fn(),
    location: null,
    weather: undefined,
    isLoading: false,
    isRefreshing: false,
    weatherError: null,
    onRefresh: jest.fn(),
    ...overrides,
  };
}

describe('WeatherScreen', () => {
  it('selects a service and adapts its visual theme from provider metadata', async () => {
    const props = createProps();
    const view = await render(<WeatherScreen {...props} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'MET Norway' }));
    expect(props.onSelectProvider).toHaveBeenCalledWith('met-norway');
    await view.rerender(<WeatherScreen {...props} selectedProviderId="met-norway" />);
    expect(screen.getByRole('radio', { name: 'MET Norway' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'MET Norway' })).toHaveStyle({
      backgroundColor: PROVIDER_PRESENTATIONS[1].surface,
    });
    expect(screen.getByText(PROVIDER_PRESENTATIONS[1].description)).toBeOnTheScreen();
  });

  it('supports changing the location and submitting from the keyboard or search button', async () => {
    const props = createProps();
    await render(<WeatherScreen {...props} />);
    await fireEvent.changeText(screen.getByLabelText('Location'), 'London');
    expect(props.onChangeQuery).toHaveBeenCalledWith('London');
    await fireEvent(screen.getByLabelText('Location'), 'submitEditing');
    await fireEvent.press(screen.getByRole('button', { name: 'Search location' }));
    expect(props.onSearch).toHaveBeenCalledTimes(2);
  });

  it('announces validation errors and lets the user choose an unambiguous result', async () => {
    const props = createProps({ validationError: 'Enter at least 2 characters.' });
    const view = await render(<WeatherScreen {...props} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least 2 characters.');
    await view.rerender(<WeatherScreen {...props} validationError={null} locations={[location]} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Tbilisi, Tbilisi, Georgia' }));
    expect(props.onSelectLocation).toHaveBeenCalledWith(location);
  });

  it('labels retained weather as last available after a refresh failure and supports retry', async () => {
    const props = createProps({
      location,
      weather,
      weatherError: 'The service is temporarily unavailable.',
    });
    await render(<WeatherScreen {...props} />);
    expect(screen.getByText(/Last available ·/)).toBeOnTheScreen();
    expect(screen.getByText('Showing the last available data for this source.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Retry weather' }));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('renders only the metrics supported by the selected service', async () => {
    const props = createProps({ location, weather });
    const view = await render(<WeatherScreen {...props} />);
    expect(screen.getByText('Feels like · °C')).toBeOnTheScreen();
    await view.rerender(
      <WeatherScreen {...props} weather={{ ...weather, feelsLikeCelsius: null }} />,
    );
    expect(screen.queryByText('Feels like · °C')).toBeNull();
    expect(screen.getByText('Humidity')).toBeOnTheScreen();
  });

  it('prevents repeated refreshes while a request is in progress', async () => {
    const props = createProps({ location, weather, isRefreshing: true });
    await render(<WeatherScreen {...props} />);
    const refresh = screen.getByRole('button', { name: 'Refresh weather' });
    expect(refresh).toBeDisabled();
    await fireEvent.press(refresh);
    expect(props.onRefresh).not.toHaveBeenCalled();
  });

  it('renders a moon for a clear nighttime forecast', async () => {
    await render(
      <WeatherScreen
        {...createProps({
          location,
          weather: {
            ...weather,
            condition: 'cloudy',
            hourly: [
              {
                timestamp: '2026-10-26T23:00:00Z',
                temperatureCelsius: 12,
                condition: 'clear',
                isDay: false,
              },
            ],
          },
        })}
      />,
    );
    expect(screen.getByTestId('icon-moon', { includeHiddenElements: true })).toBeOnTheScreen();
  });

  it('offers a real location shortcut without displaying sample weather', async () => {
    const props = createProps();
    await render(<WeatherScreen {...props} />);
    expect(screen.queryByText('Humidity')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Try Tbilisi' }));
    expect(props.onSelectLocation).toHaveBeenCalledWith(location);
  });
});
