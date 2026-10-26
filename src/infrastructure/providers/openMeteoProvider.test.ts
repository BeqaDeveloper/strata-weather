import type { HttpClient } from '../http/httpClient';
import { openMeteoFixture, testLocation } from './fixtures.test-support';
import { createOpenMeteoProvider } from './openMeteoProvider';

describe('Open-Meteo adapter', () => {
  const signal = new AbortController().signal;

  it('normalizes canonical units and selects the next six future hours', async () => {
    const get = jest.fn().mockResolvedValue(openMeteoFixture());
    const report = await createOpenMeteoProvider({ get }).getWeather(testLocation, signal);
    expect(report).toMatchObject({
      providerId: 'open-meteo',
      location: testLocation,
      temperatureCelsius: 18,
      feelsLikeCelsius: 17.2,
      windSpeedKmh: 12.4,
      humidityPercent: 60,
      condition: 'partly-cloudy',
      isDay: true,
    });
    expect(report.hourly).toHaveLength(6);
    expect(report.hourly[0]).toMatchObject({
      timestamp: new Date(1793012400000).toISOString(),
      temperatureCelsius: 18,
      isDay: true,
    });
    expect(report.hourly[3]?.isDay).toBe(false);
    const url = new URL(String(get.mock.calls[0]?.[0]));
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('hourly')).toBe('temperature_2m,weather_code,is_day');
    expect(get).toHaveBeenCalledWith(expect.any(String), { signal });
  });

  it('omits missing hourly values without rendering NaN', async () => {
    const response = openMeteoFixture();
    response.hourly.temperature_2m[1] = null;
    const get = jest.fn().mockResolvedValue(response);
    const report = await createOpenMeteoProvider({ get }).getWeather(testLocation, signal);
    expect(report.hourly[0]?.temperatureCelsius).toBe(19);
  });

  it.each([
    {},
    { current: null },
    {
      ...openMeteoFixture(),
      current: { ...openMeteoFixture().current, relative_humidity_2m: 101 },
    },
    { ...openMeteoFixture(), current_units: { temperature_2m: '°F' } },
    { ...openMeteoFixture(), hourly: { time: [1], temperature_2m: [], weather_code: [0] } },
    {
      ...openMeteoFixture(),
      hourly: { ...openMeteoFixture().hourly, is_day: [1] },
    },
    {
      ...openMeteoFixture(),
      hourly: { ...openMeteoFixture().hourly, is_day: [1, 1, 1, 1, 2, 0, 0, 0] },
    },
  ])('rejects malformed or incompatible payloads', async (payload) => {
    const http: HttpClient = { get: jest.fn().mockResolvedValue(payload) };
    await expect(
      createOpenMeteoProvider(http).getWeather(testLocation, signal),
    ).rejects.toMatchObject({ code: 'invalid-response', retryable: false });
  });
});
