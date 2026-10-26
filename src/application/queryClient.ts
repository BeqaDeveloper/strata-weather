import { QueryCache, QueryClient } from '@tanstack/react-query';

import { toWeatherError } from '../domain/errors';
import { silentLogger, writeLogSafely, type Logger } from '../shared/observability/logger';
import { QUERY_POLICY, shouldRetryRequest } from './queryPolicy';

export function createQueryClient(logger: Logger = silentLogger) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const failure = toWeatherError(error);
        const operation = query.meta?.operation;
        writeLogSafely(logger, {
          event: 'query.failed',
          operation:
            operation === 'weather' || operation === 'location-search' ? operation : 'unknown',
          errorCode: failure.code,
          retryable: failure.retryable,
        });
      },
    }),
    defaultOptions: {
      queries: {
        gcTime: QUERY_POLICY.inactiveRetentionMs,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: shouldRetryRequest,
        retryDelay: QUERY_POLICY.retryDelayMs,
      },
    },
  });
}
