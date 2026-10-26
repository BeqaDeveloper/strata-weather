import type { WeatherProvider } from '../domain/weather';
import { MET_NORWAY_PRESENTATION, OPEN_METEO_PRESENTATION } from '../presentation/providers';
import { createProviderCatalog, type ProviderRegistration } from './providerCatalog';

function registration(id = 'open-meteo'): ProviderRegistration {
  const adapter: WeatherProvider = { id, getWeather: jest.fn() };
  return { adapter, presentation: { ...OPEN_METEO_PRESENTATION, id } };
}

describe('provider catalog configuration', () => {
  it('registers a new provider and its theme without changing orchestration', () => {
    const existing = registration();
    const added = registration('new-weather-service');
    const catalog = createProviderCatalog([existing, added], added.adapter.id);
    expect(catalog.providers.get(added.adapter.id)).toBe(added.adapter);
    expect(catalog.presentations.map(({ id }) => id)).toEqual([
      'open-meteo',
      'new-weather-service',
    ]);
    expect(catalog.defaultProviderId).toBe('new-weather-service');
  });

  it('rejects an empty catalog', () => {
    expect(() => createProviderCatalog([], 'missing')).toThrow('at least one');
  });

  it.each(['', '  '])('rejects empty service identifiers %p', (id) => {
    expect(() => createProviderCatalog([registration(id)], id)).toThrow('matching presentation');
  });

  it('rejects an adapter with a different visual identifier', () => {
    expect(() =>
      createProviderCatalog(
        [{ adapter: registration().adapter, presentation: MET_NORWAY_PRESENTATION }],
        'open-meteo',
      ),
    ).toThrow('matching presentation');
  });

  it('rejects duplicate service identifiers before requests can run', () => {
    expect(() => createProviderCatalog([registration(), registration()], 'open-meteo')).toThrow(
      'Duplicate',
    );
  });

  it('rejects an unregistered default service', () => {
    expect(() => createProviderCatalog([registration()], 'removed-service')).toThrow(
      'default weather service',
    );
  });
});
