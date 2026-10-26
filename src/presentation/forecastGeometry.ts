import type { HourlyWeather } from '../domain/weather';

export interface ForecastPoint {
  readonly x: number;
  readonly y: number;
}

export function createForecastPoints(
  hours: readonly HourlyWeather[],
  width = 600,
  height = 72,
): readonly ForecastPoint[] {
  if (hours.length < 2) return [];
  const temperatures = hours.map((hour) => hour.temperatureCelsius);
  const times = hours.map((hour) => Date.parse(hour.timestamp));
  if (
    times.some(
      (time, index) => !Number.isFinite(time) || (index > 0 && time <= (times[index - 1] ?? time)),
    )
  )
    return [];
  const minimum = Math.min(...temperatures);
  const maximum = Math.max(...temperatures);
  const firstTime = times[0] ?? 0;
  const lastTime = times.at(-1) ?? 0;
  const duration = lastTime - firstTime;
  if (!Number.isFinite(duration) || duration <= 0) return [];
  return hours.map((hour) => ({
    x: 12 + ((Date.parse(hour.timestamp) - firstTime) / duration) * (width - 24),
    y:
      maximum === minimum
        ? height / 2
        : 12 + ((maximum - hour.temperatureCelsius) / (maximum - minimum)) * (height - 24),
  }));
}
