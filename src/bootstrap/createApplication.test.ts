import { createApplication } from './createApplication';

describe('application session isolation', () => {
  it('creates independent services and query caches for separate app sessions', () => {
    const first = createApplication();
    const second = createApplication();
    first.queryClient.setQueryData(['session-only'], { selected: 'first-session' });
    expect(second.queryClient.getQueryData(['session-only'])).toBeUndefined();
    for (const [id, provider] of first.weather.providers) {
      expect(second.weather.providers.get(id)).not.toBe(provider);
      expect(first.catalog.presentations.some((presentation) => presentation.id === id)).toBe(true);
    }
    expect(first.weather.providers.has(first.weather.initialProviderId)).toBe(true);
    first.queryClient.clear();
    second.queryClient.clear();
  });
});
