import { createHttpClient } from './httpClient';
import { createLogger, type LogRecord } from '../../shared/observability/logger';

function response(status: number, data: unknown, headers: Record<string, string> = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (name: string) => headers[name] ?? null },
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response;
}

function mockFetch() {
  return jest.fn() as jest.MockedFunction<typeof fetch>;
}

describe('HTTP client', () => {
  const signal = new AbortController().signal;

  it('retrieves JSON and passes the caller signal through its timeout controller', async () => {
    const fetch = mockFetch().mockResolvedValue(response(200, { value: 42 }));
    expect(await createHttpClient({ fetch }).get('https://example.com', { signal })).toEqual({
      value: 42,
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it.each([
    [429, 'rate-limit', false],
    [401, 'unavailable', false],
    [403, 'unavailable', false],
    [404, 'unavailable', false],
    [500, 'unavailable', true],
    [503, 'unavailable', true],
    [203, 'unavailable', false],
  ])('maps status %i to an actionable %s error', async (status, code, retryable) => {
    const fetch = mockFetch().mockResolvedValue(response(Number(status), {}));
    await expect(
      createHttpClient({ fetch }).get('https://example.com', { signal }),
    ).rejects.toMatchObject({ code, retryable });
  });

  it('maps transport errors without exposing internals', async () => {
    const fetch = mockFetch().mockRejectedValue(new Error('internal socket info'));
    await expect(
      createHttpClient({ fetch }).get('https://example.com', { signal }),
    ).rejects.toMatchObject({ code: 'network', retryable: true });
  });

  it('rejects invalid JSON', async () => {
    const invalid = response(200, null);
    (invalid.json as jest.Mock).mockRejectedValue(new SyntaxError('Unexpected token'));
    await expect(
      createHttpClient({ fetch: mockFetch().mockResolvedValue(invalid) }).get(
        'https://example.com',
        { signal },
      ),
    ).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it('avoids requests for fresh cache entries and conditionally revalidates expired entries', async () => {
    let now = Date.parse('2026-10-26T12:00:00Z');
    const fetch = mockFetch()
      .mockResolvedValueOnce(
        response(
          200,
          { temperature: 18 },
          {
            Expires: 'Mon, 26 Oct 2026 12:05:00 GMT',
            'Last-Modified': 'Mon, 26 Oct 2026 11:00:00 GMT',
          },
        ),
      )
      .mockResolvedValueOnce(response(304, null, { Expires: 'Mon, 26 Oct 2026 12:10:00 GMT' }));
    const http = createHttpClient({ fetch, now: () => now });
    expect(await http.get('https://example.com', { signal, cache: true })).toEqual({
      temperature: 18,
    });
    expect(await http.get('https://example.com', { signal, cache: true })).toEqual({
      temperature: 18,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    now += 6 * 60_000;
    expect(await http.get('https://example.com', { signal, cache: true })).toEqual({
      temperature: 18,
    });
    expect(fetch).toHaveBeenLastCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          'If-Modified-Since': 'Mon, 26 Oct 2026 11:00:00 GMT',
        },
      }),
    );
    expect(await http.get('https://example.com', { signal, cache: true })).toEqual({
      temperature: 18,
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not use cached data without a caller opt-in', async () => {
    const fetch = mockFetch().mockResolvedValue(
      response(200, {}, { Expires: 'Mon, 26 Oct 2099 12:05:00 GMT' }),
    );
    const http = createHttpClient({ fetch });
    await http.get('https://example.com', { signal, cache: true });
    await http.get('https://example.com', { signal });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('invalidates a cached response so validation failures can recover', async () => {
    const fetch = mockFetch().mockResolvedValue(response(200, { value: 1 }));
    const http = createHttpClient({ fetch });
    await http.get('https://example.com', { signal, cache: true });
    http.invalidate('https://example.com');
    await http.get('https://example.com', { signal, cache: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('records safe request duration and endpoint names without location details', async () => {
    const records: LogRecord[] = [];
    let now = 100;
    const fetch = mockFetch().mockImplementation(async () => {
      now += 37;
      return response(200, { city: 'Secret City' });
    });
    const http = createHttpClient({
      fetch,
      now: () => now,
      logger: createLogger((record) => records.push(record)),
    });
    await http.get('https://geocoding-api.open-meteo.com/v1/search?name=Secret%20City', {
      signal,
      headers: { Authorization: 'private' },
    });
    expect(records).toEqual([
      expect.objectContaining({ event: 'http.request_started', endpoint: 'location-search' }),
      expect.objectContaining({
        event: 'http.request_succeeded',
        endpoint: 'location-search',
        durationMs: 37,
        status: 200,
      }),
    ]);
    expect(JSON.stringify(records)).not.toMatch(/Secret|private|Authorization|https|name=/);
  });

  it.each([
    ['https://api.open-meteo.com/v1/forecast?latitude=1', 'open-meteo-weather'],
    ['https://api.met.no/weatherapi/locationforecast?lat=1', 'met-norway-weather'],
    ['https://api.open-meteo.com.attacker.invalid?token=secret', 'unknown'],
    ['private malformed url', 'unknown'],
  ])('uses an allowlisted endpoint for %s', async (url, endpoint) => {
    const sink = jest.fn();
    await createHttpClient({
      fetch: mockFetch().mockResolvedValue(response(200, {})),
      logger: createLogger(sink),
    }).get(url, { signal });
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'http.request_started', endpoint }),
    );
  });

  it('emits a cache hit and conditional revalidation as distinct events', async () => {
    let now = 0;
    const sink = jest.fn();
    const fetch = mockFetch()
      .mockResolvedValueOnce(
        response(
          200,
          {},
          { Expires: new Date(1000).toUTCString(), 'Last-Modified': new Date(0).toUTCString() },
        ),
      )
      .mockResolvedValueOnce(response(304, null, { Expires: new Date(3000).toUTCString() }));
    const http = createHttpClient({ fetch, now: () => now, logger: createLogger(sink) });
    await http.get('https://api.met.no/', { signal, cache: true });
    await http.get('https://api.met.no/', { signal, cache: true });
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'http.cache_hit', endpoint: 'met-norway-weather' }),
    );
    now = 2000;
    await http.get('https://api.met.no/', { signal, cache: true });
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'http.cache_revalidated', status: 304 }),
    );
    http.invalidate('https://api.met.no/');
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ event: 'http.cache_invalidated' }));
  });

  it('records an HTTP failure once using its safe classification', async () => {
    const sink = jest.fn();
    await expect(
      createHttpClient({
        fetch: mockFetch().mockResolvedValue(response(503, { message: 'private' })),
        logger: createLogger(sink),
      }).get('https://api.met.no/?lat=42', { signal }),
    ).rejects.toMatchObject({ code: 'unavailable' });
    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink).toHaveBeenLastCalledWith(
      expect.objectContaining({
        event: 'http.request_failed',
        endpoint: 'met-norway-weather',
        status: 503,
        errorCode: 'unavailable',
        retryable: true,
        level: 'warn',
      }),
    );
    expect(JSON.stringify(sink.mock.calls)).not.toMatch(/private|lat=/);
  });

  it('does not allow injected logger failures to change request results', async () => {
    const http = createHttpClient({
      fetch: mockFetch().mockResolvedValue(response(200, { value: 42 })),
      logger: {
        log: () => {
          throw new Error('Broken sink');
        },
      },
    });
    await expect(http.get('https://example.com', { signal })).resolves.toEqual({ value: 42 });
  });

  it('rejects a 304 response without a cache entry', async () => {
    await expect(
      createHttpClient({ fetch: mockFetch().mockResolvedValue(response(304, null)) }).get(
        'https://example.com',
        { signal },
      ),
    ).rejects.toMatchObject({ code: 'invalid-response' });
  });

  it('bounds the cache and falls back to a short lifetime without server expiry', async () => {
    let now = 0;
    const fetch = mockFetch().mockResolvedValue(response(200, { value: 1 }));
    const http = createHttpClient({ fetch, now: () => now });
    for (let index = 0; index < 101; index += 1) {
      await http.get(`https://example.com/${index}`, { signal, cache: true });
    }
    await http.get('https://example.com/100', { signal, cache: true });
    expect(fetch).toHaveBeenCalledTimes(101);
    await http.get('https://example.com/0', { signal, cache: true });
    expect(fetch).toHaveBeenCalledTimes(102);
    now = 60_001;
    await http.get('https://example.com/100', { signal, cache: true });
    expect(fetch).toHaveBeenCalledTimes(103);
  });

  it('cancels requests when the caller aborts', async () => {
    const controller = new AbortController();
    const fetch = mockFetch().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), {
            once: true,
          });
        }),
    );
    const pending = createHttpClient({ fetch }).get('https://example.com', {
      signal: controller.signal,
    });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'cancelled', retryable: false });
  });

  it('does not start a request when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetch = mockFetch();
    await expect(
      createHttpClient({ fetch }).get('https://example.com', { signal: controller.signal }),
    ).rejects.toMatchObject({ code: 'cancelled' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('classifies cancellation as debug telemetry without a failure event', async () => {
    const controller = new AbortController();
    const sink = jest.fn();
    const fetch = mockFetch().mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('private')), {
            once: true,
          });
        }),
    );
    const http = createHttpClient({ fetch, logger: createLogger(sink) });
    const pending = http.get('https://api.met.no/', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'cancelled' });
    expect(sink).toHaveBeenLastCalledWith(
      expect.objectContaining({ event: 'http.request_cancelled', level: 'debug' }),
    );
    expect(sink.mock.calls.flat()).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ event: 'http.request_failed' })]),
    );
  });

  it('aborts slow requests and reports timeouts separately', async () => {
    jest.useFakeTimers();
    try {
      const fetch = mockFetch().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), {
              once: true,
            });
          }),
      );
      const pending = createHttpClient({ fetch, timeoutMs: 100 }).get('https://example.com', {
        signal,
      });
      const assertion = expect(pending).rejects.toMatchObject({ code: 'timeout', retryable: true });
      await jest.advanceTimersByTimeAsync(100);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});
