import type { WeatherLocation } from '../domain/weather';
import { formatLocalTime, formatLocationDetails, formatTemperature } from './formatting';

describe('weather formatting', () => {
  it.each([
    [12.6, '13°'],
    [-7.8, '-8°'],
    [0, '0°'],
  ])('rounds %s Celsius consistently', (value, expected) => {
    expect(formatTemperature(value)).toBe(expected);
  });

  it('formats weather in the searched location timezone', () => {
    expect(formatLocalTime('2026-10-26T12:30:00Z', 'Asia/Tbilisi')).toBe('4:30 PM');
  });

  it('accounts for daylight saving transitions', () => {
    expect(formatLocalTime('2026-07-01T12:00:00Z', 'Europe/London')).toBe('1:00 PM');
    expect(formatLocalTime('2026-12-01T12:00:00Z', 'Europe/London')).toBe('12:00 PM');
  });

  it('falls back to UTC for an unsupported timezone', () => {
    expect(formatLocalTime('2026-10-26T12:30:00Z', 'Missing/Timezone')).toBe('12:30 PM');
  });

  it('handles an invalid timestamp without crashing the screen', () => {
    expect(formatLocalTime('invalid', 'Asia/Tbilisi')).toBe('—');
  });

  it('keeps regional context while avoiding duplicate labels', () => {
    const location: WeatherLocation = {
      id: '1',
      name: 'Example',
      region: 'Georgia',
      country: 'Georgia',
      latitude: 41.7,
      longitude: 44.8,
      timezone: 'Asia/Tbilisi',
    };
    expect(formatLocationDetails(location)).toBe('Georgia');
    expect(formatLocationDetails({ ...location, region: '' })).toBe('Georgia');
    expect(formatLocationDetails({ ...location, region: 'Tbilisi' })).toBe('Tbilisi, Georgia');
  });
});
