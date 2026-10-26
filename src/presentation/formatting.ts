import type { WeatherCondition, WeatherLocation } from '../domain/weather';

export const CONDITION_LABELS: Readonly<Record<WeatherCondition, string>> = {
  clear: 'Clear skies',
  'partly-cloudy': 'Partly cloudy',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  rain: 'Rainy',
  snow: 'Snowy',
  thunderstorm: 'Thunderstorms',
  unknown: 'Conditions unavailable',
};

export function formatTemperature(value: number): string {
  return `${Math.round(value)}°`;
}

export function formatLocationDetails(location: WeatherLocation): string {
  return [...new Set([location.region, location.country].filter(Boolean))].join(', ');
}

export function formatLocalTime(timestamp: string, timezone: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date);
  }
}
