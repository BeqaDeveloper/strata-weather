import { createLocationSearch } from './openMeteoLocationSearch';

describe('Open-Meteo location search', () => {
  const signal = new AbortController().signal;

  it('maps multiple locations without silently selecting an ambiguous city', async () => {
    const get = jest.fn().mockResolvedValue({
      results: [
        {
          id: 1,
          name: 'Paris',
          latitude: 48.85,
          longitude: 2.35,
          country: 'France',
          admin1: 'Île-de-France',
          timezone: 'Europe/Paris',
        },
        { id: 2, name: 'Paris', latitude: 33.66, longitude: -95.55 },
      ],
    });
    const locations = await createLocationSearch({ get }).search('  Paris  ', signal);
    expect(locations).toHaveLength(2);
    expect(locations[0]).toMatchObject({
      id: '1',
      region: 'Île-de-France',
      timezone: 'Europe/Paris',
    });
    expect(locations[1]).toMatchObject({ country: '', region: '', timezone: 'UTC' });
    expect(new URL(String(get.mock.calls[0]?.[0])).searchParams.get('name')).toBe('Paris');
  });

  it('returns an empty result for an unknown location', async () => {
    expect(
      await createLocationSearch({ get: jest.fn().mockResolvedValue({}) }).search(
        'Noplacexyz',
        signal,
      ),
    ).toEqual([]);
  });

  it('rejects invalid queries before making a request', async () => {
    const get = jest.fn();
    await expect(createLocationSearch({ get }).search('<script>', signal)).rejects.toMatchObject({
      code: 'invalid-response',
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('validates coordinates and rejects malformed results', async () => {
    const get = jest
      .fn()
      .mockResolvedValue({ results: [{ id: 1, name: 'Paris', latitude: 200, longitude: 2 }] });
    await expect(createLocationSearch({ get }).search('Paris', signal)).rejects.toMatchObject({
      code: 'invalid-response',
    });
  });

  it('falls back to UTC for invalid upstream timezones', async () => {
    const get = jest.fn().mockResolvedValue({
      results: [
        { id: 1, name: 'Paris', latitude: 48.85, longitude: 2.35, timezone: 'invalid/zone' },
      ],
    });
    expect((await createLocationSearch({ get }).search('Paris', signal))[0]?.timezone).toBe('UTC');
  });
});
