import {
  createConsoleLogSink,
  createLogger,
  silentLogger,
  writeLogSafely,
  type LogEvent,
  type LogRecord,
} from './logger';

describe('structured logger', () => {
  it('isolates failures from custom logger implementations at application boundaries', () => {
    const event = { event: 'app.render_failed', code: 'unexpected-render' } as const;
    const log = jest.fn();
    writeLogSafely({ log }, event);
    expect(log).toHaveBeenCalledWith(event);
    expect(() =>
      writeLogSafely(
        {
          log: () => {
            throw new Error('Custom reporting failed');
          },
        },
        event,
      ),
    ).not.toThrow();
  });
  it('writes a bounded typed record and strips unexpected sensitive fields', () => {
    const sink = jest.fn();
    const logger = createLogger(sink);
    const event = {
      event: 'http.request_failed',
      endpoint: 'location-search',
      durationMs: 42.7,
      status: 503,
      errorCode: 'unavailable',
      retryable: true,
      query: 'Secret City',
      url: 'https://example.com?lat=12.3456&key=private',
      headers: { Authorization: 'secret' },
      error: new Error('Private request payload'),
    } as const;

    logger.log(event);

    expect(sink).toHaveBeenCalledWith({
      event: 'http.request_failed',
      endpoint: 'location-search',
      durationMs: 43,
      status: 503,
      errorCode: 'unavailable',
      retryable: true,
      level: 'warn',
      timestamp: expect.any(String),
    });
    expect(JSON.stringify(sink.mock.calls)).not.toMatch(
      /Secret|private|Authorization|payload|12\.3456/,
    );
  });

  it.each([
    [{ event: 'http.request_started', endpoint: 'unknown' }, 'debug'],
    [{ event: 'http.cache_hit', endpoint: 'met-norway-weather' }, 'debug'],
    [{ event: 'http.cache_invalidated', endpoint: 'met-norway-weather' }, 'debug'],
    [{ event: 'http.request_cancelled', endpoint: 'unknown', durationMs: 1 }, 'debug'],
    [
      {
        event: 'http.request_succeeded',
        endpoint: 'open-meteo-weather',
        durationMs: 2,
        status: 200,
      },
      'info',
    ],
    [
      {
        event: 'http.cache_revalidated',
        endpoint: 'met-norway-weather',
        durationMs: 3,
        status: 304,
      },
      'debug',
    ],
    [{ event: 'app.render_failed', code: 'unexpected-render' }, 'error'],
    [
      { event: 'query.failed', operation: 'weather', errorCode: 'unexpected', retryable: false },
      'warn',
    ],
  ] as const)('assigns severity to $event.event', (event, level) => {
    const sink = jest.fn();
    createLogger(sink).log(event);
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ ...event, level }));
  });

  it('sanitizes runtime values that bypass TypeScript', () => {
    const records: LogRecord[] = [];
    const logger = createLogger((record) => records.push(record));
    logger.log({
      event: 'http.request_failed',
      endpoint: 'private city',
      durationMs: Number.NaN,
      status: -100,
      errorCode: 'secret token',
      retryable: 'yes',
    } as unknown as LogEvent);
    logger.log({
      event: 'http.request_succeeded',
      endpoint: 'unknown',
      durationMs: -100,
      status: 999,
    });
    logger.log({
      event: 'query.failed',
      operation: 'private query',
      errorCode: 'private exception',
      retryable: 'yes',
    } as unknown as LogEvent);
    expect(records[0]).toEqual(
      expect.objectContaining({
        endpoint: 'unknown',
        durationMs: 0,
        errorCode: 'network',
        retryable: false,
      }),
    );
    expect(records[0]).not.toHaveProperty('status');
    expect(records[1]).toEqual(expect.objectContaining({ durationMs: 0, status: 200 }));
    expect(records[2]).toEqual(
      expect.objectContaining({ operation: 'unknown', errorCode: 'unexpected', retryable: false }),
    );
    expect(JSON.stringify(records)).not.toMatch(/private|secret/);
  });

  it('never exports React error details from an unexpected render failure', () => {
    const sink = jest.fn();
    createLogger(sink).log({
      event: 'app.render_failed',
      code: 'private crash text',
      error: new Error('token'),
      componentStack: 'user location',
    } as unknown as LogEvent);
    expect(sink).toHaveBeenCalledWith({
      event: 'app.render_failed',
      code: 'unexpected-render',
      level: 'error',
      timestamp: expect.any(String),
    });
  });

  it('drops unknown and malformed events', () => {
    const sink = jest.fn();
    const logger = createLogger(sink);
    logger.log({ event: 'private event', endpoint: 'unknown' } as unknown as LogEvent);
    logger.log(null as unknown as LogEvent);
    expect(sink).not.toHaveBeenCalled();
  });

  it('protects application behavior from failing telemetry sinks', () => {
    const logger = createLogger(() => {
      throw new Error('Reporting failed');
    });
    expect(() =>
      logger.log({ event: 'app.render_failed', code: 'unexpected-render' }),
    ).not.toThrow();
    expect(() =>
      silentLogger.log({ event: 'app.render_failed', code: 'unexpected-render' }),
    ).not.toThrow();
  });

  it('routes records to an explicitly configured console sink', () => {
    const target = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const logger = createLogger(createConsoleLogSink(target));
    logger.log({ event: 'http.request_started', endpoint: 'unknown' });
    logger.log({
      event: 'http.request_succeeded',
      endpoint: 'unknown',
      durationMs: 1,
      status: 200,
    });
    logger.log({
      event: 'http.request_failed',
      endpoint: 'unknown',
      durationMs: 1,
      errorCode: 'network',
      retryable: true,
    });
    logger.log({ event: 'app.render_failed', code: 'unexpected-render' });
    for (const method of Object.values(target)) {
      expect(method).toHaveBeenCalledWith(
        '[strata]',
        expect.objectContaining({ timestamp: expect.any(String) }),
      );
    }
  });

  it('uses the global console only when a console sink is explicitly requested', () => {
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    silentLogger.log({ event: 'http.request_started', endpoint: 'unknown' });
    expect(debug).not.toHaveBeenCalled();
    createLogger(createConsoleLogSink()).log({
      event: 'http.request_started',
      endpoint: 'unknown',
    });
    expect(debug).toHaveBeenCalledTimes(1);
  });
});
