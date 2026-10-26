import type { HourlyWeather } from '../domain/weather';
import { createForecastPoints, createForecastTimeline } from './forecastGeometry';

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

describe('forecast timeline layout', () => {
  it('uses the same coordinates for plotted points and readings with enough touch-free reading space', () => {
    const timeline = createForecastTimeline(
      [
        hour('2026-10-26T10:00:00Z', 10),
        hour('2026-10-26T11:00:00Z', 12),
        hour('2026-10-26T12:00:00Z', 14),
        hour('2026-10-26T13:00:00Z', 13),
        hour('2026-10-26T14:00:00Z', 12),
        hour('2026-10-26T15:00:00Z', 11),
      ],
      276,
    );
    expect(timeline.width).toBe(424);
    expect(timeline.positions[0]).toBe(32);
    expect(timeline.positions.at(-1)).toBe(timeline.width - 32);
    expect(timeline.points.map(({ x }) => x)).toEqual(timeline.positions);
    expect(
      timeline.positions
        .slice(1)
        .every((position, index) => position - (timeline.positions[index] ?? position) >= 72),
    ).toBe(true);
  });

  it('preserves uneven forecast intervals without allowing labels to overlap', () => {
    const timeline = createForecastTimeline(
      [
        hour('2026-10-26T10:00:00Z', 10),
        hour('2026-10-26T11:00:00Z', 12),
        hour('2026-10-26T14:00:00Z', 14),
      ],
      320,
    );
    const firstGap = (timeline.positions[1] ?? 0) - (timeline.positions[0] ?? 0);
    const secondGap = (timeline.positions[2] ?? 0) - (timeline.positions[1] ?? 0);
    expect(firstGap).toBeGreaterThanOrEqual(72);
    expect(secondGap / firstGap).toBeCloseTo(3);
    expect(timeline.points.map(({ x }) => x)).toEqual(timeline.positions);
  });

  it('omits the plot for pathological intervals rather than stretching an unsafe canvas', () => {
    const timeline = createForecastTimeline(
      [
        hour('2026-10-26T10:00:00Z', 10),
        hour('2026-10-26T10:00:01Z', 12),
        hour('2026-10-27T10:00:00Z', 14),
      ],
      320,
    );
    expect(timeline.points).toEqual([]);
    expect(timeline.width).toBeLessThanOrEqual(2048);
    expect(timeline.positions).toEqual([32, 104, 176]);
  });

  it.each([
    [hour('invalid', 10), hour('2026-10-26T12:00:00Z', 12)],
    [hour('2026-10-26T12:00:00Z', 10), hour('2026-10-26T11:00:00Z', 12)],
    [hour('2026-10-26T12:00:00Z', Number.NaN), hour('2026-10-26T13:00:00Z', 12)],
  ])('keeps invalid data readable without producing invalid geometry', (...hours) => {
    const timeline = createForecastTimeline(hours, Number.NaN);
    expect(timeline.points).toEqual([]);
    expect(Number.isFinite(timeline.width)).toBe(true);
  });

  it('does not invent a line for empty or single-reading forecasts', () => {
    expect(createForecastTimeline([], 0).points).toEqual([]);
    expect(createForecastTimeline([hour('2026-10-26T12:00:00Z', 12)]).points).toEqual([]);
  });
});
