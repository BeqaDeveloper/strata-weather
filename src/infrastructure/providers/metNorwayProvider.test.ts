import { metNorwayFixture, testLocation } from './fixtures.test-support';
import { createMetNorwayProvider } from './metNorwayProvider';

describe('MET Norway adapter', () => {
  const signal = new AbortController().signal;

  it('converts m/s to km/h, preserves missing capabilities and sends identification', async () => {
    const get = jest.fn().mockResolvedValue(metNorwayFixture());
    const report = await createMetNorwayProvider({ get }).getWeather(testLocation, signal);
    expect(report).toMatchObject({
      providerId: 'met-norway',
      feelsLikeCelsius: null,
      windSpeedKmh: 19.8,
      condition: 'partly-cloudy',
      isDay: false,
    });
    expect(report.hourly).toHaveLength(6);
    expect(report.hourly[0]?.temperatureCelsius).toBe(19);
    expect(report.hourly[0]?.isDay).toBe(false);
    expect(get).toHaveBeenCalledWith(
      'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=41.6941&lon=44.8337',
      expect.objectContaining({
        signal,
        cache: true,
        headers: {
          'User-Agent': expect.stringContaining('github.com/BeqaDeveloper/strata-weather'),
        },
      }),
    );
  });

  it('uses a six-hour symbol when an hourly symbol is unavailable', async () => {
    const fixture = metNorwayFixture();
    const entry = fixture.properties.timeseries[0];
    if (!entry) throw new Error('Missing fixture');
    const payload = {
      ...fixture,
      properties: {
        ...fixture.properties,
        timeseries: [
          {
            ...entry,
            data: {
              instant: entry.data.instant,
              next_6_hours: { summary: { symbol_code: 'rain_day' } },
            },
          },
        ],
      },
    };
    const report = await createMetNorwayProvider({
      get: jest.fn().mockResolvedValue(payload),
    }).getWeather(testLocation, signal);
    expect(report.condition).toBe('rain');
  });

  it.each([
    ['clearsky_day', true],
    ['clearsky_night', false],
    ['cloudy', null],
    ['fair_polartwilight', null],
  ])('preserves hourly daylight metadata for %s', async (symbol, isDay) => {
    const fixture = metNorwayFixture();
    for (const entry of fixture.properties.timeseries) {
      entry.data.next_1_hours.summary.symbol_code = symbol as string;
    }
    const report = await createMetNorwayProvider({
      get: jest.fn().mockResolvedValue(fixture),
    }).getWeather(testLocation, signal);
    expect(report.hourly[0]?.isDay).toBe(isDay);
  });

  it('handles missing summaries as an unknown condition', async () => {
    const fixture = metNorwayFixture();
    const entry = fixture.properties.timeseries[0];
    if (!entry) throw new Error('Missing fixture');
    const payload = {
      ...fixture,
      properties: {
        ...fixture.properties,
        timeseries: [{ ...entry, data: { instant: entry.data.instant } }],
      },
    };
    expect(
      (
        await createMetNorwayProvider({ get: jest.fn().mockResolvedValue(payload) }).getWeather(
          testLocation,
          signal,
        )
      ).condition,
    ).toBe('unknown');
  });

  it.each([
    {},
    { properties: { timeseries: [] } },
    {
      ...metNorwayFixture(),
      properties: {
        ...metNorwayFixture().properties,
        meta: {
          units: { air_temperature: 'fahrenheit', relative_humidity: '%', wind_speed: 'm/s' },
        },
      },
    },
  ])('rejects invalid MET payloads', async (payload) => {
    await expect(
      createMetNorwayProvider({ get: jest.fn().mockResolvedValue(payload) }).getWeather(
        testLocation,
        signal,
      ),
    ).rejects.toMatchObject({ code: 'invalid-response' });
  });
});
