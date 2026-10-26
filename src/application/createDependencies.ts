import { createHttpClient } from '../infrastructure/http/httpClient';
import { createLocationSearch } from '../infrastructure/location/openMeteoLocationSearch';
import { createMetNorwayProvider } from '../infrastructure/providers/metNorwayProvider';
import { createOpenMeteoProvider } from '../infrastructure/providers/openMeteoProvider';
import type { WeatherDependencies } from './useWeatherController';

export function createDependencies(): WeatherDependencies {
  const http = createHttpClient();
  const providers = [createOpenMeteoProvider(http), createMetNorwayProvider(http)];
  return {
    providers: new Map(providers.map((provider) => [provider.id, provider])),
    locationSearch: createLocationSearch(http),
    initialProviderId: 'open-meteo',
  };
}
