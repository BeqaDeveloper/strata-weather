import type { WeatherLocation } from '../domain/weather';

export const weatherQueryKeys = {
  locations: (query: string | null) => ['locations', query] as const,
  forecast: (providerId: string, location: WeatherLocation | null) =>
    [
      'weather',
      providerId,
      location?.id,
      location?.latitude,
      location?.longitude,
      location?.timezone,
    ] as const,
};
