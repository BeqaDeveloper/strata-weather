import { z } from 'zod';

import { WeatherError } from '../../domain/errors';
import type { WeatherProvider } from '../../domain/weather';
import type { HttpClient } from '../http/httpClient';
import { conditionFromMetSymbol } from './conditions';

const summary = z.object({ summary: z.object({ symbol_code: z.string() }) });

function daylightFromSymbol(symbol: string): boolean | null {
  if (symbol.endsWith('_night')) return false;
  if (symbol.endsWith('_day')) return true;
  return null;
}
const responseSchema = z.object({
  properties: z.object({
    meta: z.object({
      units: z.object({
        air_temperature: z.literal('celsius'),
        relative_humidity: z.literal('%'),
        wind_speed: z.literal('m/s'),
      }),
    }),
    timeseries: z
      .array(
        z.object({
          time: z.iso.datetime(),
          data: z.object({
            instant: z.object({
              details: z.object({
                air_temperature: z.number().min(-150).max(100),
                relative_humidity: z.number().min(0).max(100),
                wind_speed: z.number().min(0),
              }),
            }),
            next_1_hours: summary.optional(),
            next_6_hours: summary.optional(),
            next_12_hours: summary.optional(),
          }),
        }),
      )
      .min(1),
  }),
});

export function createMetNorwayProvider(http: HttpClient): WeatherProvider {
  return {
    id: 'met-norway',
    async getWeather(location, signal) {
      const params = new URLSearchParams({
        latitude: location.latitude.toFixed(4),
        longitude: location.longitude.toFixed(4),
      });
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${params.get('latitude')}&lon=${params.get('longitude')}`;
      const result = responseSchema.safeParse(
        await http.get(url, {
          signal,
          cache: true,
          headers: {
            'User-Agent': 'StrataWeather/1.0 (https://github.com/BeqaDeveloper/strata-weather)',
          },
        }),
      );
      if (!result.success) {
        http.invalidate(url);
        throw new WeatherError(
          'invalid-response',
          'MET Norway returned incomplete weather data. Try the other service.',
        );
      }
      const entries = result.data.properties.timeseries;
      const current = entries[0];
      if (!current)
        throw new WeatherError('invalid-response', 'MET Norway has no forecast for this location.');
      const symbolFor = (data: typeof current.data) =>
        (data.next_1_hours ?? data.next_6_hours ?? data.next_12_hours)?.summary.symbol_code ?? '';
      const symbol = symbolFor(current.data);
      const details = current.data.instant.details;
      return {
        providerId: 'met-norway',
        location,
        timestamp: current.time,
        temperatureCelsius: details.air_temperature,
        feelsLikeCelsius: null,
        humidityPercent: details.relative_humidity,
        windSpeedKmh: Math.round(details.wind_speed * 36) / 10,
        condition: conditionFromMetSymbol(symbol),
        isDay: daylightFromSymbol(symbol),
        hourly: entries.slice(1, 7).map((entry) => ({
          timestamp: entry.time,
          temperatureCelsius: entry.data.instant.details.air_temperature,
          condition: conditionFromMetSymbol(symbolFor(entry.data)),
          isDay: daylightFromSymbol(symbolFor(entry.data)),
        })),
        attribution: 'Forecast by MET Norway · CC BY 4.0 · wind converted to km/h',
        attributionUrl: 'https://api.met.no/doc/License',
      };
    },
  };
}
