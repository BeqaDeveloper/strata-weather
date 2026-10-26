import type { WeatherProvider } from '../domain/weather';
import type { ProviderDefinition } from '../presentation/providers';

export interface ProviderRegistration {
  readonly adapter: WeatherProvider;
  readonly presentation: ProviderDefinition;
}

export interface ProviderCatalog {
  readonly providers: ReadonlyMap<string, WeatherProvider>;
  readonly presentations: readonly ProviderDefinition[];
  readonly defaultProviderId: string;
}

export function createProviderCatalog(
  registrations: readonly ProviderRegistration[],
  defaultProviderId: string,
): ProviderCatalog {
  if (registrations.length === 0) throw new Error('Register at least one weather service.');
  const providers = new Map<string, WeatherProvider>();
  for (const { adapter, presentation } of registrations) {
    if (!adapter.id.trim() || adapter.id !== presentation.id) {
      throw new Error('Each weather adapter must have a matching presentation identifier.');
    }
    if (providers.has(adapter.id)) throw new Error(`Duplicate weather service: ${adapter.id}`);
    providers.set(adapter.id, adapter);
  }
  if (!providers.has(defaultProviderId))
    throw new Error('The default weather service is not registered.');
  return {
    providers,
    presentations: Object.freeze(registrations.map(({ presentation }) => presentation)),
    defaultProviderId,
  };
}
