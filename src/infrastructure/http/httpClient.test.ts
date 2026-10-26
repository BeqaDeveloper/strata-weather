import { createHttpClient } from './httpClient';

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
