import type { WeatherErrorCode } from '../../domain/errors';

export type HttpEndpoint =
  'open-meteo-weather' | 'met-norway-weather' | 'location-search' | 'unknown';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type RequestContext = { readonly endpoint: HttpEndpoint };
type RequestTiming = RequestContext & { readonly durationMs: number };

export type LogEvent =
  | (RequestContext & {
      readonly event: 'http.request_started' | 'http.cache_hit' | 'http.cache_invalidated';
    })
  | (RequestTiming & { readonly event: 'http.request_succeeded'; readonly status: number })
  | (RequestTiming & { readonly event: 'http.cache_revalidated'; readonly status: 304 })
  | (RequestTiming & { readonly event: 'http.request_cancelled' })
  | (RequestTiming & {
      readonly event: 'http.request_failed';
      readonly status?: number;
      readonly errorCode: WeatherErrorCode;
      readonly retryable: boolean;
    })
  | { readonly event: 'app.render_failed'; readonly code: 'unexpected-render' }
  | {
      readonly event: 'query.failed';
      readonly operation: 'weather' | 'location-search' | 'unknown';
      readonly errorCode: WeatherErrorCode;
      readonly retryable: boolean;
    };

export type LogRecord = LogEvent & {
  readonly level: LogLevel;
  readonly timestamp: string;
};

export type LogSink = (record: LogRecord) => void;

export interface Logger {
  log(event: LogEvent): void;
}

export function writeLogSafely(logger: Logger, event: LogEvent): void {
  try {
    logger.log(event);
  } catch {
    return;
  }
}

const ENDPOINTS = new Set<HttpEndpoint>([
  'open-meteo-weather',
  'met-norway-weather',
  'location-search',
  'unknown',
]);

const ERROR_CODES = new Set<WeatherErrorCode>([
  'network',
  'timeout',
  'rate-limit',
  'unavailable',
  'invalid-response',
  'cancelled',
  'unexpected',
]);

function duration(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function status(value: number | undefined): number | undefined {
  return value !== undefined && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : undefined;
}

function sanitize(event: LogEvent): LogEvent | null {
  if (event.event === 'app.render_failed') {
    return { event: 'app.render_failed', code: 'unexpected-render' };
  }

  if (event.event === 'query.failed') {
    return {
      event: 'query.failed',
      operation:
        event.operation === 'weather' || event.operation === 'location-search'
          ? event.operation
          : 'unknown',
      errorCode: ERROR_CODES.has(event.errorCode) ? event.errorCode : 'unexpected',
      retryable: event.retryable === true,
    };
  }

  const endpoint = ENDPOINTS.has(event.endpoint) ? event.endpoint : 'unknown';

  switch (event.event) {
    case 'http.request_started':
    case 'http.cache_hit':
    case 'http.cache_invalidated':
      return { event: event.event, endpoint };
    case 'http.request_cancelled':
      return { event: event.event, endpoint, durationMs: duration(event.durationMs) };
    case 'http.request_succeeded':
      return {
        event: event.event,
        endpoint,
        durationMs: duration(event.durationMs),
        status: status(event.status) ?? 200,
      };
    case 'http.cache_revalidated':
      return { event: event.event, endpoint, durationMs: duration(event.durationMs), status: 304 };
    case 'http.request_failed':
      return {
        event: event.event,
        endpoint,
        durationMs: duration(event.durationMs),
        ...(status(event.status) !== undefined ? { status: status(event.status) } : {}),
        errorCode: ERROR_CODES.has(event.errorCode) ? event.errorCode : 'network',
        retryable: event.retryable === true,
      };
    default:
      return null;
  }
}

function levelFor(event: LogEvent): LogLevel {
  switch (event.event) {
    case 'app.render_failed':
      return 'error';
    case 'http.request_failed':
    case 'query.failed':
      return 'warn';
    case 'http.request_succeeded':
      return 'info';
    default:
      return 'debug';
  }
}

export function createLogger(sink: LogSink): Logger {
  return {
    log(event) {
      try {
        const safeEvent = sanitize(event);
        if (safeEvent) {
          sink({ ...safeEvent, level: levelFor(safeEvent), timestamp: new Date().toISOString() });
        }
      } catch {
        return;
      }
    },
  };
}

export const silentLogger: Logger = Object.freeze({ log: () => undefined });

export function createConsoleLogSink(target: Pick<Console, LogLevel> = console): LogSink {
  return (record) => target[record.level]('[strata]', record);
}
