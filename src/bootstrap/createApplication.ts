import { createQueryClient } from '../application/queryClient';
import type { WeatherDependencies } from '../application/ports';
import { createHttpClient } from '../infrastructure/http/httpClient';
import { createLocationSearch } from '../infrastructure/location/openMeteoLocationSearch';
import { createMetNorwayProvider } from '../infrastructure/providers/metNorwayProvider';
import { createOpenMeteoProvider } from '../infrastructure/providers/openMeteoProvider';
import { MET_NORWAY_PRESENTATION, OPEN_METEO_PRESENTATION } from '../presentation/providers';
import { silentLogger, type Logger } from '../shared/observability/logger';
import { createProviderCatalog } from './providerCatalog';

export function createApplication(logger: Logger = silentLogger) {
  const http = createHttpClient({ logger });
  const catalog = createProviderCatalog(
    [
      { adapter: createOpenMeteoProvider(http), presentation: OPEN_METEO_PRESENTATION },
      { adapter: createMetNorwayProvider(http), presentation: MET_NORWAY_PRESENTATION },
    ],
    OPEN_METEO_PRESENTATION.id,
  );
  const weather: WeatherDependencies = {
    providers: catalog.providers,
    locationSearch: createLocationSearch(http),
    initialProviderId: catalog.defaultProviderId,
  };
  return { weather, catalog, queryClient: createQueryClient(logger) };
}
