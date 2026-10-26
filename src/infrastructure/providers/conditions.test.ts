import { conditionFromMetSymbol, conditionFromWmo } from './conditions';

describe('condition normalization', () => {
  it.each([
    [0, 'clear'],
    [1, 'partly-cloudy'],
    [2, 'partly-cloudy'],
    [3, 'cloudy'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'rain'],
    [61, 'rain'],
    [67, 'rain'],
    [80, 'rain'],
    [82, 'rain'],
    [71, 'snow'],
    [77, 'snow'],
    [85, 'snow'],
    [86, 'snow'],
    [95, 'thunderstorm'],
    [96, 'thunderstorm'],
    [99, 'thunderstorm'],
    [200, 'unknown'],
  ])('maps WMO %i to %s', (code, condition) => {
    expect(conditionFromWmo(Number(code))).toBe(condition);
  });

  it.each([
    ['clearsky_day', 'clear'],
    ['fair_night', 'partly-cloudy'],
    ['partlycloudy_polartwilight', 'partly-cloudy'],
    ['cloudy', 'cloudy'],
    ['fog', 'fog'],
    ['heavyrainshowers_day', 'rain'],
    ['lightsleet', 'snow'],
    ['snow', 'snow'],
    ['rainshowersandthunder_day', 'thunderstorm'],
    ['future_symbol', 'unknown'],
  ])('maps MET %s to %s', (symbol, condition) => {
    expect(conditionFromMetSymbol(symbol)).toBe(condition);
  });
});
