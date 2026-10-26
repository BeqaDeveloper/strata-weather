import type { WeatherCondition } from '../../domain/weather';

export function conditionFromWmo(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code === 1 || code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if (code === 95 || code === 96 || code === 99) return 'thunderstorm';
  return 'unknown';
}

export function conditionFromMetSymbol(symbol: string): WeatherCondition {
  if (symbol.includes('thunder')) return 'thunderstorm';
  if (symbol.includes('snow') || symbol.includes('sleet')) return 'snow';
  if (symbol.includes('rain')) return 'rain';
  if (symbol.startsWith('clearsky')) return 'clear';
  if (symbol.startsWith('fair') || symbol.startsWith('partlycloudy')) return 'partly-cloudy';
  if (symbol.startsWith('cloudy')) return 'cloudy';
  if (symbol.startsWith('fog')) return 'fog';
  return 'unknown';
}
