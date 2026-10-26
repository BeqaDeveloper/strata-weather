import { WeatherError } from '../domain/errors';

export const QUERY_POLICY = {
  inactiveRetentionMs: 15 * 60 * 1000,
  locationFreshnessMs: 24 * 60 * 60 * 1000,
  forecastFreshnessMs: 0,
  retryDelayMs: 1000,
} as const;

export function shouldRetryRequest(failureCount: number, error: Error): boolean {
  return failureCount < 1 && error instanceof WeatherError && error.retryable;
}
