import type { HourlyWeather } from '../domain/weather';
import { createForecastPoints } from './forecastGeometry';

function hour(timestamp: string, temperatureCelsius: number): HourlyWeather {
  return { timestamp, temperatureCelsius, condition: 'clear', isDay: true };
}

describe('createForecastPoints', () => {
  it('does not invent a trend without at least two measurements', () => {
    expect(createForecastPoints([])).toEqual([]);
    expect(createForecastPoints([hour('2026-10-26T10:00:00Z', 12)])).toEqual([]);
  });

  it('spaces measurements by actual elapsed time and maps temperature extrema', () => {
    const points = createForecastPoints(
      [
        hour('2026-10-26T10:00:00Z', 10),
        hour('2026-10-26T11:00:00Z', 12),
        hour('2026-10-26T13:00:00Z', 14),
      ],
      300,
      72,
    );
    expect(points).toEqual([
      { x: 12, y: 60 },
      { x: 104, y: 36 },
      { x: 288, y: 12 },
    ]);
  });

  it('draws a stable flat trace for constant temperatures', () => {
    expect(
      createForecastPoints([
        hour('2026-10-26T10:00:00Z', -5),
        hour('2026-10-26T11:00:00Z', -5),
      ]).map(({ y }) => y),
    ).toEqual([36, 36]);
  });

  it('rejects timestamps that cannot form a time axis', () => {
    expect(
      createForecastPoints([
        hour('2026-10-26T10:00:00Z', 10),
        hour('invalid', 12),
        hour('2026-10-26T12:00:00Z', 13),
      ]),
    ).toEqual([]);
    expect(createForecastPoints([hour('invalid', 10), hour('2026-10-26T11:00:00Z', 12)])).toEqual(
      [],
    );
    expect(
      createForecastPoints([hour('2026-10-26T10:00:00Z', 10), hour('2026-10-26T10:00:00Z', 12)]),
    ).toEqual([]);
  });
});
