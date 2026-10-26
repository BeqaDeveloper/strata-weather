import { WeatherError } from '../domain/errors';
import type { LogEvent } from '../shared/observability/logger';
import { createQueryClient } from './queryClient';

describe('query failure reporting', () => {
  it('reports a final provider failure without exposing the query key or error details', async () => {
    const log = jest.fn<void, [LogEvent]>();
    const client = createQueryClient({ log });
    await expect(
      client.fetchQuery({
        queryKey: ['weather', 'private-city', 41.7, 44.8],
        queryFn: () => {
          throw new WeatherError('invalid-response', 'private raw payload');
        },
        meta: { operation: 'weather' },
      }),
    ).rejects.toBeInstanceOf(WeatherError);
    expect(log).toHaveBeenCalledWith({
      event: 'query.failed',
      operation: 'weather',
      errorCode: 'invalid-response',
      retryable: false,
    });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/private|41\.7|44\.8/);
    client.clear();
  });

  it('classifies unknown failures without claiming a network problem', async () => {
    const log = jest.fn<void, [LogEvent]>();
    const client = createQueryClient({ log });
    await expect(
      client.fetchQuery({
        queryKey: ['unclassified'],
        queryFn: () => {
          throw new Error('private defect');
        },
      }),
    ).rejects.toThrow('private defect');
    expect(log).toHaveBeenCalledWith({
      event: 'query.failed',
      operation: 'unknown',
      errorCode: 'unexpected',
      retryable: false,
    });
    client.clear();
  });

  it('keeps reporting adapter failures from replacing the original query error', async () => {
    const client = createQueryClient({
      log: () => {
        throw new Error('reporter unavailable');
      },
    });
    const original = new WeatherError('unavailable', 'Service unavailable.');
    await expect(
      client.fetchQuery({
        queryKey: ['failure'],
        queryFn: () => {
          throw original;
        },
      }),
    ).rejects.toBe(original);
    client.clear();
  });
});
