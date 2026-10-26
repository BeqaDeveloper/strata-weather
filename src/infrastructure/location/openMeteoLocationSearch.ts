import { z } from 'zod';

import { WeatherError } from '../../domain/errors';
import { validateLocationQuery } from '../../domain/validation';
import type { LocationSearch } from '../../domain/weather';
import type { HttpClient } from '../http/httpClient';

const responseSchema = z.object({
  error: z.literal(false).optional(),
  results: z
    .array(
      z.object({
        id: z.number().int(),
        name: z.string().min(1),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        admin1: z.string().optional(),
        country: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

function safeTimezone(timezone: string | undefined): string {
  if (!timezone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return timezone;
  } catch {
    return 'UTC';
  }
}

export function createLocationSearch(http: HttpClient): LocationSearch {
  return {
    async search(query, signal) {
      const validation = validateLocationQuery(query);
      if (!validation.success) throw new WeatherError('invalid-response', validation.error);
      const params = new URLSearchParams({
        name: validation.value,
        count: '6',
        language: 'en',
        format: 'json',
      });
      const result = responseSchema.safeParse(
        await http.get(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
          signal,
        }),
      );
      if (!result.success)
        throw new WeatherError(
          'invalid-response',
          'Location search returned incomplete data. Please try again.',
        );
      return (result.data.results ?? []).map((location) => ({
        id: String(location.id),
        name: location.name,
        region: location.admin1 ?? '',
        country: location.country ?? '',
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: safeTimezone(location.timezone),
      }));
    },
  };
}
