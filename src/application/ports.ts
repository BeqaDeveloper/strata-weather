import type { LocationSearch, WeatherProvider } from '../domain/weather';

export interface WeatherDependencies {
  readonly providers: ReadonlyMap<string, WeatherProvider>;
  readonly locationSearch: LocationSearch;
  readonly initialProviderId: string;
}
