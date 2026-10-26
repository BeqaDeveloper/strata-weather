import { z } from 'zod';

import { WeatherError } from '../../domain/errors';
import type { WeatherProvider } from '../../domain/weather';
import type { HttpClient } from '../http/httpClient';
import { conditionFromWmo } from './conditions';

const unixTime = z.number().min(0).max(8_640_000_000_000);
const temperature = z.number().min(-150).max(100);
const responseSchema = z.object({
  current_units: z.object({
    temperature_2m: z.literal('°C'),
    apparent_temperature: z.literal('°C'),
    relative_humidity_2m: z.literal('%'),
    wind_speed_10m: z.literal('km/h'),
  }),
  current: z.object({
    time: unixTime,
    temperature_2m: temperature,
    apparent_temperature: temperature,
    relative_humidity_2m: z.number().min(0).max(100),
    wind_speed_10m: z.number().min(0),
    weather_code: z.number().int(),
    is_day: z.union([z.literal(0), z.literal(1)]),
  }),
  hourly_units: z.object({ temperature_2m: z.literal('°C') }),
  hourly: z
    .object({
      time: z.array(unixTime).min(1),
      temperature_2m: z.array(temperature.nullable()).min(1),
      weather_code: z.array(z.number().int().nullable()).min(1),
      is_day: z.array(z.union([z.literal(0), z.literal(1)])).min(1),
    })
    .refine(
      (hourly) =>
        hourly.time.length === hourly.temperature_2m.length &&
        hourly.time.length === hourly.weather_code.length &&
        hourly.time.length === hourly.is_day.length,
    ),
});

export function createOpenMeteoProvider(http: HttpClient): WeatherProvider {
  return {
    id: 'open-meteo',
    async getWeather(location, signal) {
      const params = new URLSearchParams({
        latitude: location.latitude.toFixed(4),
        longitude: location.longitude.toFixed(4),
        current:
          'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
        hourly: 'temperature_2m,weather_code,is_day',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
        timeformat: 'unixtime',
        timezone: 'UTC',
        forecast_days: '2',
      });
      const result = responseSchema.safeParse(
        await http.get(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal }),
      );
      if (!result.success)
        throw new WeatherError(
          'invalid-response',
          'Open-Meteo returned incomplete weather data. Try the other service.',
        );
      const { current, hourly } = result.data;
      const upcoming = hourly.time
        .flatMap((time, index) => {
          const temperatureCelsius = hourly.temperature_2m[index];
          const code = hourly.weather_code[index];
          if (time < current.time || temperatureCelsius == null || code == null) return [];
          return [
            {
              timestamp: new Date(time * 1000).toISOString(),
              temperatureCelsius,
              condition: conditionFromWmo(code),
              isDay: hourly.is_day[index] === 1,
            },
          ];
        })
        .slice(0, 6);
      return {
        providerId: 'open-meteo',
        location,
        timestamp: new Date(current.time * 1000).toISOString(),
        temperatureCelsius: current.temperature_2m,
        feelsLikeCelsius: current.apparent_temperature,
        humidityPercent: current.relative_humidity_2m,
        windSpeedKmh: current.wind_speed_10m,
        condition: conditionFromWmo(current.weather_code),
        isDay: current.is_day === 1,
        hourly: upcoming,
        attribution: 'Weather data by Open-Meteo · CC BY 4.0',
        attributionUrl: 'https://open-meteo.com/',
      };
    },
  };
}
