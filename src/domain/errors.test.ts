import { toWeatherError, WeatherError } from './errors';

describe('toWeatherError', () => {
  it('preserves actionable provider errors', () => {
    const error = new WeatherError('rate-limit', 'Try later.');
    expect(toWeatherError(error)).toBe(error);
    expect(error.name).toBe('WeatherError');
  });

  it('maps unknown failures to a safe actionable message', () => {
    expect(toWeatherError(new Error('private transport details'))).toMatchObject({
      code: 'unexpected',
      retryable: false,
    });
    expect(toWeatherError(null).message).not.toContain('private');
  });
});
