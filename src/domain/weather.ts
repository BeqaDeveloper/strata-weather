export type WeatherCondition =
  'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm' | 'unknown';

export interface WeatherLocation {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly country: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timezone: string;
}

export interface HourlyWeather {
  readonly timestamp: string;
  readonly temperatureCelsius: number;
  readonly condition: WeatherCondition;
  readonly isDay: boolean | null;
}

export interface WeatherReport {
  readonly providerId: string;
  readonly location: WeatherLocation;
  readonly timestamp: string;
  readonly temperatureCelsius: number;
  readonly feelsLikeCelsius: number | null;
  readonly humidityPercent: number;
  readonly windSpeedKmh: number;
  readonly condition: WeatherCondition;
  readonly isDay: boolean | null;
  readonly hourly: readonly HourlyWeather[];
  readonly attribution: string;
  readonly attributionUrl: string;
}

export interface WeatherProvider {
  readonly id: string;
  getWeather(location: WeatherLocation, signal: AbortSignal): Promise<WeatherReport>;
}

export interface LocationSearch {
  search(query: string, signal: AbortSignal): Promise<readonly WeatherLocation[]>;
}
