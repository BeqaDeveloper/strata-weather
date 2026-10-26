import { WeatherError } from '../../domain/errors';
import {
  silentLogger,
  writeLogSafely,
  type HttpEndpoint,
  type Logger,
  type LogEvent,
} from '../../shared/observability/logger';

export interface HttpOptions {
  readonly signal: AbortSignal;
  readonly headers?: Readonly<Record<string, string>>;
  readonly cache?: boolean;
}

export interface HttpClient {
  get(url: string, options: HttpOptions): Promise<unknown>;
  invalidate(url: string): void;
}

interface CachedResponse {
  readonly data: unknown;
  readonly expiresAt: number;
  readonly lastModified: string | null;
}

interface HttpClientOptions {
  readonly fetch?: typeof fetch;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  readonly logger?: Logger;
}

function endpointFor(url: string): HttpEndpoint {
  try {
    const { hostname } = new URL(url);
    if (hostname === 'api.open-meteo.com') return 'open-meteo-weather';
    if (hostname === 'api.met.no') return 'met-norway-weather';
    if (hostname === 'geocoding-api.open-meteo.com') return 'location-search';
  } catch {
    return 'unknown';
  }
  return 'unknown';
}

function statusError(status: number): WeatherError {
  if (status === 429) {
    return new WeatherError(
      'rate-limit',
      'This service is busy. Wait a moment or try the other service.',
    );
  }
  if (status === 401 || status === 403) {
    return new WeatherError(
      'unavailable',
      'This service is not available right now. Try the other service.',
    );
  }
  return new WeatherError(
    'unavailable',
    'This weather service could not respond. Try again or switch services.',
    status >= 500,
  );
}

export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const fetcher = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const now = options.now ?? Date.now;
  const elapsedNow = options.now ?? (() => globalThis.performance?.now() ?? Date.now());
  const logger = options.logger ?? silentLogger;
  const cache = new Map<string, CachedResponse>();

  function log(event: LogEvent) {
    writeLogSafely(logger, event);
  }

  return {
    invalidate(url) {
      cache.delete(url);
      log({ event: 'http.cache_invalidated', endpoint: endpointFor(url) });
    },
    async get(url, request) {
      const endpoint = endpointFor(url);
      const startedAt = elapsedNow();
      const durationMs = () => Math.max(0, elapsedNow() - startedAt);
      if (request.signal.aborted) {
        log({ event: 'http.request_cancelled', endpoint, durationMs: 0 });
        throw new WeatherError('cancelled', 'Request cancelled.');
      }
      const previous = request.cache ? cache.get(url) : undefined;
      if (previous && previous.expiresAt > now()) {
        log({ event: 'http.cache_hit', endpoint });
        return previous.data;
      }
      const controller = new AbortController();
      let timedOut = false;
      const onAbort = () => controller.abort();
      request.signal.addEventListener('abort', onAbort, { once: true });
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      let responseStatus: number | undefined;
      log({ event: 'http.request_started', endpoint });

      try {
        const response = await fetcher(url, {
          signal: controller.signal,
          headers: {
            Accept: 'application/json',
            ...request.headers,
            ...(previous?.lastModified ? { 'If-Modified-Since': previous.lastModified } : {}),
          },
        });
        responseStatus = response.status;
        if (response.status === 203) {
          throw new WeatherError(
            'unavailable',
            'This service endpoint is being retired. Try the other service.',
          );
        }
        if (!response.ok && response.status !== 304) throw statusError(response.status);
        if (response.status === 304 && !previous) {
          throw new WeatherError(
            'invalid-response',
            'The service returned an incomplete response. Try the other service.',
          );
        }
        let data: unknown;
        try {
          data = response.status === 304 ? previous?.data : await response.json();
        } catch {
          throw new WeatherError(
            'invalid-response',
            'The service returned unreadable weather data. Try the other service.',
          );
        }
        if (request.cache) {
          const serverExpiry = Date.parse(response.headers.get('Expires') ?? '');
          cache.delete(url);
          cache.set(url, {
            data,
            expiresAt: Number.isFinite(serverExpiry) ? serverExpiry : now() + 60_000,
            lastModified: response.headers.get('Last-Modified') ?? previous?.lastModified ?? null,
          });
          if (cache.size > 100) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey !== undefined) cache.delete(oldestKey);
          }
        }
        if (response.status === 304) {
          log({ event: 'http.cache_revalidated', endpoint, durationMs: durationMs(), status: 304 });
        }
        log({
          event: 'http.request_succeeded',
          endpoint,
          durationMs: durationMs(),
          status: response.status,
        });
        return data;
      } catch (error) {
        const failure = timedOut
          ? new WeatherError(
              'timeout',
              'This service took too long. Try again or switch services.',
              true,
            )
          : request.signal.aborted
            ? new WeatherError('cancelled', 'Request cancelled.')
            : error instanceof WeatherError
              ? error
              : new WeatherError(
                  'network',
                  'Could not connect. Check your connection and try again.',
                  true,
                );
        if (failure.code === 'cancelled') {
          log({ event: 'http.request_cancelled', endpoint, durationMs: durationMs() });
        } else {
          log({
            event: 'http.request_failed',
            endpoint,
            durationMs: durationMs(),
            ...(responseStatus !== undefined ? { status: responseStatus } : {}),
            errorCode: failure.code,
            retryable: failure.retryable,
          });
        }
        throw failure;
      } finally {
        clearTimeout(timeout);
        request.signal.removeEventListener('abort', onAbort);
      }
    },
  };
}
