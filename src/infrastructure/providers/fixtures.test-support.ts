import type { WeatherLocation } from '../../domain/weather';

export const testLocation: WeatherLocation = {
  id: '611717',
  name: 'Tbilisi',
  region: 'Tbilisi',
  country: 'Georgia',
  latitude: 41.694111,
  longitude: 44.833678,
  timezone: 'Asia/Tbilisi',
};

export function openMeteoFixture() {
  return {
    current_units: {
      temperature_2m: '°C',
      apparent_temperature: '°C',
      relative_humidity_2m: '%',
      wind_speed_10m: 'km/h',
    },
    current: {
      time: 1793010600,
      temperature_2m: 18,
      apparent_temperature: 17.2,
      relative_humidity_2m: 60,
      wind_speed_10m: 12.4,
      weather_code: 2,
      is_day: 1,
    },
    hourly_units: { temperature_2m: '°C' },
    hourly: {
      time: [
        1793008800, 1793012400, 1793016000, 1793019600, 1793023200, 1793026800, 1793030400,
        1793034000,
      ],
      temperature_2m: [17, 18, 19, 20, 18, 17, 16, 15] as (number | null)[],
      weather_code: [0, 1, 2, 3, 61, 80, 95, 0] as (number | null)[],
      is_day: [1, 1, 1, 1, 0, 0, 0, 0],
    },
  };
}

export function metNorwayFixture() {
  return {
    properties: {
      meta: { units: { air_temperature: 'celsius', relative_humidity: '%', wind_speed: 'm/s' } },
      timeseries: Array.from({ length: 8 }, (_, index) => ({
        time: new Date(1793008800000 + index * 3600000).toISOString(),
        data: {
          instant: {
            details: { air_temperature: 18 + index, relative_humidity: 65, wind_speed: 5.5 },
          },
          next_1_hours: { summary: { symbol_code: 'partlycloudy_night' } },
        },
      })),
    },
  };
}
