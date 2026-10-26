import type { HourlyWeather } from '../domain/weather';

export interface ForecastPoint {
  readonly x: number;
  readonly y: number;
}

export interface ForecastTimeline {
  readonly width: number;
  readonly positions: readonly number[];
  readonly points: readonly ForecastPoint[];
}

export function createForecastTimeline(
  hours: readonly HourlyWeather[],
  viewportWidth = 360,
): ForecastTimeline {
  const viewport =
    Number.isFinite(viewportWidth) && viewportWidth > 0 ? Math.min(viewportWidth, 2048) : 360;
  const fallback = () => ({
    width: Math.max(viewport, hours.length * 72),
    positions: hours.map((_, index) => 32 + index * 72),
    points: [],
  });
  if (hours.length < 2) return fallback();
  const times = hours.map((hour) => Date.parse(hour.timestamp));
  if (
    times.some(
      (time, index) => !Number.isFinite(time) || (index > 0 && time <= (times[index - 1] ?? time)),
    ) ||
    hours.some((hour) => !Number.isFinite(hour.temperatureCelsius))
  )
    return fallback();
  const first = times[0] ?? 0;
  const duration = (times.at(-1) ?? first) - first;
  const minimumInterval = Math.min(
    ...times.slice(1).map((time, index) => time - (times[index] ?? time)),
  );
  const width = Math.max(viewport, 64 + (duration / minimumInterval) * 72);
  if (!Number.isFinite(width) || width > 2048) return fallback();
  const positions = times.map((time) => 32 + ((time - first) / duration) * (width - 64));
  return {
    width,
    positions,
    points: createForecastPoints(hours, width).map((point, index) => ({
      ...point,
      x: positions[index] ?? 32,
    })),
  };
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
