import { validateLocationQuery } from './validation';

describe('validateLocationQuery', () => {
  it.each(['', ' ', 'a', '1', '---', '<script>', 'https://example.com', 'Paris😀', 'a'.repeat(81)])(
    'rejects invalid location %j',
    (input) => {
      expect(validateLocationQuery(input).success).toBe(false);
    },
  );

  it.each([
    'თბილისი',
    'São Paulo',
    'St. John’s',
    '75001',
    'Paris, France',
    '東京',
    'Baden-Baden',
    'Washington, D.C.',
  ])('accepts international city names and postal codes: %s', (input) => {
    expect(validateLocationQuery(input)).toEqual({ success: true, value: input });
  });

  it('normalizes full-width characters and repeated whitespace', () => {
    expect(validateLocationQuery('  Ｔｏｋｙｏ   Japan  ')).toEqual({
      success: true,
      value: 'Tokyo Japan',
    });
  });
});
