export type WeatherErrorCode =
  'network' | 'timeout' | 'rate-limit' | 'unavailable' | 'invalid-response' | 'cancelled';

export class WeatherError extends Error {
  constructor(
    public readonly code: WeatherErrorCode,
    message: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'WeatherError';
  }
}

export function toWeatherError(error: unknown): WeatherError {
  if (error instanceof WeatherError) return error;
  return new WeatherError(
    'network',
    'Could not connect. Check your connection and try again.',
    true,
  );
}
