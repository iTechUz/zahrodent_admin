import { AUTH_NOTICE_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_AT_KEY } from './auth-token';

type ClientModule = typeof import('./client');

const fetchMock = vi.fn();

function jsonResponse(body: unknown, init: { status?: number; statusText?: string } = {}) {
  return new Response(body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body), {
    status: init.status ?? 200,
    statusText: init.statusText,
  });
}

async function loadClient(apiUrl?: string): Promise<ClientModule> {
  vi.resetModules();
  if (apiUrl === undefined) vi.stubEnv('VITE_API_URL', undefined as unknown as string);
  else vi.stubEnv('VITE_API_URL', apiUrl);
  return import('./client');
}

const originalLocation = window.location;
const assignMock = vi.fn();

function setPathname(pathname: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, pathname, assign: assignMock },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  assignMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  localStorage.clear();
  sessionStorage.clear();
  setPathname('/patients');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('apiBaseUrl', () => {
  it('uses VITE_API_URL as-is when it has a protocol', async () => {
    const { apiBaseUrl } = await loadClient('https://api.zahro.uz');
    expect(apiBaseUrl).toBe('https://api.zahro.uz');
  });

  it('prefixes https:// when VITE_API_URL has no protocol', async () => {
    const { apiBaseUrl } = await loadClient('api.zahro.uz');
    expect(apiBaseUrl).toBe('https://api.zahro.uz');
  });

  it('falls back to http://localhost:3000 when VITE_API_URL is not set', async () => {
    const { apiBaseUrl } = await loadClient(undefined);
    expect(apiBaseUrl).toBe('http://localhost:3000');
  });
});

describe('apiRequest', () => {
  describe('URL building', () => {
    it('joins base URL and path, stripping a trailing slash from the base', async () => {
      const { apiRequest } = await loadClient('https://api.test/');
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      await apiRequest('/patients');
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/patients');
    });

    it('adds a leading slash when the path has none', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('doctors?page=0');
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/doctors?page=0');
    });

    it('passes absolute URLs through untouched', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('https://other.host/x');
      expect(fetchMock.mock.calls[0][0]).toBe('https://other.host/x');
    });

    it('forwards method and body to fetch', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x', { method: 'PATCH', body: '{"a":1}' });
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init.method).toBe('PATCH');
      expect(init.body).toBe('{"a":1}');
      expect(init).not.toHaveProperty('skipAuth');
    });
  });

  describe('headers', () => {
    it('sends Authorization: Bearer <token> from localStorage', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok-local');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x');
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer tok-local');
    });

    it('falls back to a sessionStorage token', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'tok-session');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x');
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer tok-session');
    });

    it('omits Authorization when there is no token', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x');
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.has('Authorization')).toBe(false);
    });

    it('omits Authorization when skipAuth is set, even with a token', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/auth/login', { method: 'POST', body: '{}', skipAuth: true });
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.has('Authorization')).toBe(false);
    });

    it('sets Content-Type: application/json when there is a body', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x', { method: 'POST', body: '{}' });
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('does not set Content-Type without a body', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x');
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.has('Content-Type')).toBe(false);
    });

    it('does not set Content-Type for FormData bodies (browser sets the boundary)', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/upload', { method: 'POST', body: new FormData() });
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.has('Content-Type')).toBe(false);
    });

    it('keeps a caller-provided Content-Type and other headers', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({}));
      await apiRequest('/x', { method: 'POST', body: 'a=1', headers: { 'Content-Type': 'text/plain', 'X-Req': '1' } });
      const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
      expect(headers.get('Content-Type')).toBe('text/plain');
      expect(headers.get('X-Req')).toBe('1');
    });
  });

  describe('response handling', () => {
    it('returns parsed JSON on success', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({ data: [1, 2], total: 2 }));
      await expect(apiRequest('/x')).resolves.toEqual({ data: [1, 2], total: 2 });
    });

    it('returns null for an empty successful body (e.g. 204)', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      await expect(apiRequest('/x')).resolves.toBeNull();
    });

    it('throws ApiError("Invalid JSON response") when a 2xx body is not JSON', async () => {
      const { apiRequest, ApiError } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse('<html>proxy</html>', { status: 200 }));
      const err = await apiRequest('/x').catch((e) => e);
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toMatchObject({ status: 200, message: 'Invalid JSON response', name: 'ApiError' });
    });
  });

  describe('error parsing', () => {
    it('uses a string `message` from the backend error body', async () => {
      const { apiRequest, ApiError } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(
        jsonResponse({ success: false, statusCode: 404, message: 'Patient not found' }, { status: 404 }),
      );
      const err = (await apiRequest('/patients/x').catch((e) => e)) as InstanceType<typeof ApiError>;
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(404);
      expect(err.message).toBe('Patient not found');
    });

    it('joins an array `message` (class-validator errors) with "; "', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(
        jsonResponse({ message: ['phone: invalid', 'age: must be positive'] }, { status: 400 }),
      );
      await expect(apiRequest('/patients')).rejects.toMatchObject({
        status: 400,
        message: 'phone: invalid; age: must be positive',
      });
    });

    it('falls back to statusText when the body has no message', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({ error: 'x' }, { status: 500, statusText: 'Internal Server Error' }));
      await expect(apiRequest('/x')).rejects.toMatchObject({ status: 500, message: 'Internal Server Error' });
    });

    it('falls back to "Request failed" when there is no message and no statusText', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse('', { status: 502 }));
      await expect(apiRequest('/x')).rejects.toMatchObject({ status: 502, message: 'Request failed' });
    });

    it('uses a plain-text error body as the message', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse('Bad Gateway from nginx', { status: 502 }));
      await expect(apiRequest('/x')).rejects.toMatchObject({ status: 502, message: 'Bad Gateway from nginx' });
    });

    it('does not clear the session on non-401 errors', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Forbidden resource' }, { status: 403 }));
      await expect(apiRequest('/users')).rejects.toMatchObject({ status: 403 });
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('tok');
      expect(assignMock).not.toHaveBeenCalled();
    });
  });

  describe('401 handling', () => {
    it('without a refresh token: clears the session, leaves a notice and redirects to /login', async () => {
      const { apiRequest, ApiError, SESSION_EXPIRED_MESSAGE } = await loadClient('https://api.test');
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      localStorage.setItem(AUTH_USER_KEY, '{}');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'tok2');
      sessionStorage.setItem(AUTH_USER_KEY, '{}');
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, { status: 401 }));

      const err = await apiRequest('/patients').catch((e) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect(err).toMatchObject({ status: 401, message: SESSION_EXPIRED_MESSAGE });
      expect(fetchMock).toHaveBeenCalledTimes(1); // nothing to refresh with
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_NOTICE_KEY)).toBe(SESSION_EXPIRED_MESSAGE);
      expect(assignMock).toHaveBeenCalledWith('/login');
    });

    it('does not redirect when already on /login (bad credentials)', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      setPathname('/login');
      fetchMock.mockResolvedValue(
        jsonResponse({ message: "Telefon raqami yoki parol noto'g'ri" }, { status: 401 }),
      );
      await expect(apiRequest('/auth/login', { method: 'POST', body: '{}', skipAuth: true })).rejects.toMatchObject({
        status: 401,
        message: "Telefon raqami yoki parol noto'g'ri",
      });
      expect(assignMock).not.toHaveBeenCalled();
    });
  });

  describe('silent refresh', () => {
    type Route = (url: string, init: RequestInit) => Response | Promise<Response>;
    const authOf = (init: RequestInit) => (init.headers as Headers).get('Authorization');

    /** fetch stub: /auth/refresh → `refresh`, everything else → 401 for the old token, 200 otherwise */
    function server({
      refresh = () => jsonResponse({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 900 }),
      validToken = 'Bearer new-access',
    }: { refresh?: Route; validToken?: string } = {}) {
      fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
        if (url.endsWith('/auth/refresh')) return refresh(url, init);
        return authOf(init) === validToken
          ? jsonResponse({ ok: true, url })
          : jsonResponse({ message: 'Unauthorized' }, { status: 401 });
      });
    }
    const refreshCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'));

    function remembered(access = 'old-access', refresh = 'old-refresh') {
      localStorage.setItem(AUTH_TOKEN_KEY, access);
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      localStorage.setItem(AUTH_USER_KEY, '{}');
    }

    it('on 401 refreshes once, stores the rotated tokens and retries the request with the new token', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      server();

      await expect(apiRequest('/patients')).resolves.toMatchObject({ ok: true });

      expect(refreshCalls()).toHaveLength(1);
      const [, refreshInit] = refreshCalls()[0];
      expect(JSON.parse(refreshInit.body as string)).toEqual({ refresh_token: 'old-refresh' });
      expect(authOf(refreshInit)).toBeNull();
      const last = fetchMock.mock.calls.at(-1)!;
      expect(last[0]).toBe('https://api.test/patients');
      expect(authOf(last[1])).toBe('Bearer new-access');
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('new-access');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh');
      expect(Number(localStorage.getItem(TOKEN_EXPIRES_AT_KEY))).toBeGreaterThan(Date.now());
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('resends method and body on the retry', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      server();
      await apiRequest('/patients/p1', { method: 'PATCH', body: '{"age":30}' });
      const last = fetchMock.mock.calls.at(-1)![1] as RequestInit;
      expect(last.method).toBe('PATCH');
      expect(last.body).toBe('{"age":30}');
    });

    it('single-flight: concurrent 401s share one refresh request', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      server({
        refresh: async () => {
          await gate;
          return jsonResponse({ access_token: 'new-access', refresh_token: 'new-refresh' });
        },
      });

      const all = Promise.all([apiRequest('/a'), apiRequest('/b'), apiRequest('/c')]);
      await vi.waitFor(() => expect(refreshCalls()).toHaveLength(1));
      release();
      const results = await all;

      expect(results.map((r) => (r as { url: string }).url)).toEqual([
        'https://api.test/a',
        'https://api.test/b',
        'https://api.test/c',
      ]);
      expect(refreshCalls()).toHaveLength(1);
    });

    it('a later 401 with an already-rotated token retries with the current one (no second refresh)', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      let calls = 0;
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
        calls++;
        if (calls === 1) {
          // while this request is "in flight" another one refreshed the session
          localStorage.setItem(AUTH_TOKEN_KEY, 'new-access');
          return jsonResponse({ message: 'Unauthorized' }, { status: 401 });
        }
        return authOf(init) === 'Bearer new-access' ? jsonResponse({ ok: true }) : jsonResponse({}, { status: 401 });
      });
      await expect(apiRequest('/x')).resolves.toEqual({ ok: true });
      expect(refreshCalls()).toHaveLength(0);
    });

    it('refresh rejected (invalid / reused) → clears the session and redirects with the Uzbek message', async () => {
      const { apiRequest, SESSION_EXPIRED_MESSAGE } = await loadClient('https://api.test');
      remembered();
      server({ refresh: () => jsonResponse({ message: SESSION_EXPIRED_MESSAGE }, { status: 401 }) });

      const results = await Promise.allSettled([apiRequest('/a'), apiRequest('/b')]);

      expect(results.every((r) => r.status === 'rejected')).toBe(true);
      expect((results[0] as PromiseRejectedResult).reason).toMatchObject({ status: 401, message: SESSION_EXPIRED_MESSAGE });
      expect(refreshCalls()).toHaveLength(1);
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_NOTICE_KEY)).toBe(SESSION_EXPIRED_MESSAGE);
      expect(assignMock).toHaveBeenCalledWith('/login');
    });

    it('emits "expired" so the store logs out', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      const { onAuthEvent } = await import('./auth-events');
      const events: string[] = [];
      onAuthEvent((e) => events.push(e.type));
      remembered();
      server({ refresh: () => jsonResponse({}, { status: 401 }) });
      await apiRequest('/a').catch(() => {});
      expect(events).toEqual(['expired']);
    });

    it('emits "refreshed" with the new access token', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      const { onAuthEvent } = await import('./auth-events');
      const events: unknown[] = [];
      onAuthEvent((e) => events.push(e));
      remembered();
      server();
      await apiRequest('/a');
      expect(events).toEqual([{ type: 'refreshed', accessToken: 'new-access' }]);
    });

    it('retries only once: a 401 after a successful refresh ends the session (no loop)', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      server({ validToken: 'never' });
      await expect(apiRequest('/a')).rejects.toMatchObject({ status: 401 });
      expect(refreshCalls()).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(3); // request, refresh, retry
      expect(assignMock).toHaveBeenCalledWith('/login');
    });

    it.each(['/auth/login', '/auth/refresh', '/auth/logout'])('never refreshes for %s', async (path) => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, { status: 401 }));
      await expect(apiRequest(path, { method: 'POST', body: '{}' })).rejects.toMatchObject({ status: 401 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('old-access');
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('refreshes for /auth/me (an authenticated endpoint)', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      server();
      await expect(apiRequest('/auth/me')).resolves.toMatchObject({ ok: true });
      expect(refreshCalls()).toHaveLength(1);
    });

    it('offline during refresh: keeps the session and surfaces the network error', async () => {
      const { apiRequest, NETWORK_ERROR_MESSAGE } = await loadClient('https://api.test');
      remembered();
      server({
        refresh: () => {
          throw new TypeError('Failed to fetch');
        },
      });
      await expect(apiRequest('/a')).rejects.toMatchObject({ status: 0, message: NETWORK_ERROR_MESSAGE });
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('old-access');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('old-refresh');
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('a non-remembered session keeps the rotated tokens in sessionStorage', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'old-access');
      sessionStorage.setItem(REFRESH_TOKEN_KEY, 'old-refresh');
      server();
      await apiRequest('/a');
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('new-access');
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-refresh');
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    });

    it('another tab rotated the shared refresh token: a "reused" rejection keeps the session', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      server({
        refresh: () => {
          // the other tab finished first and wrote its tokens
          localStorage.setItem(AUTH_TOKEN_KEY, 'new-access');
          localStorage.setItem(REFRESH_TOKEN_KEY, 'tab2-refresh');
          return jsonResponse({ message: 'reused' }, { status: 401 });
        },
      });
      await expect(apiRequest('/a')).resolves.toMatchObject({ ok: true });
      expect(assignMock).not.toHaveBeenCalled();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('tab2-refresh');
    });

    it('refreshes proactively when the access token expires within 60s', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered();
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + 30_000));
      server();
      await apiRequest('/a');
      expect(fetchMock.mock.calls.map(([u]) => u)).toEqual(['https://api.test/auth/refresh', 'https://api.test/a']);
    });

    it('does not refresh proactively while the token is still fresh', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      remembered('new-access');
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + 10 * 60_000));
      server();
      await apiRequest('/a');
      expect(refreshCalls()).toHaveLength(0);
    });
  });

  describe('requestId', () => {
    it('keeps the backend requestId on the ApiError', async () => {
      const { apiRequest } = await loadClient('https://api.test');
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Server xatosi', requestId: 'req-42' }, { status: 500 }));
      await expect(apiRequest('/x')).rejects.toMatchObject({ status: 500, requestId: 'req-42' });
    });
  });

  describe('network errors', () => {
    it('wraps fetch rejections (offline / CORS / server down) in ApiError(0) with a network message', async () => {
      const { apiRequest, ApiError, NETWORK_ERROR_MESSAGE } = await loadClient('https://api.test');
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      const err = (await apiRequest('/x').catch((e) => e)) as InstanceType<typeof ApiError>;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(0);
      expect(err.isNetworkError).toBe(true);
      expect(err.message).toBe(NETWORK_ERROR_MESSAGE);
      expect(assignMock).not.toHaveBeenCalled();
    });

    it('rethrows aborts unchanged (React Query cancellation)', async () => {
      const { apiRequest, ApiError } = await loadClient('https://api.test');
      const abort = new DOMException('aborted', 'AbortError');
      fetchMock.mockRejectedValue(abort);
      const err = await apiRequest('/x').catch((e) => e);
      expect(err).toBe(abort);
      expect(err).not.toBeInstanceOf(ApiError);
    });
  });
});

describe('runtime config (window.__ENV__)', () => {
  afterEach(() => {
    delete window.__ENV__;
  });

  it('prefers window.__ENV__.VITE_API_URL over the build-time value', async () => {
    window.__ENV__ = { VITE_API_URL: 'https://runtime.api/' };
    const { apiBaseUrl } = await loadClient('https://build.api');
    expect(apiBaseUrl).toBe('https://runtime.api');
  });

  it('ignores an empty runtime value and falls back to the build-time one', async () => {
    window.__ENV__ = { VITE_API_URL: '  ' };
    const { apiBaseUrl } = await loadClient('https://build.api');
    expect(apiBaseUrl).toBe('https://build.api');
  });

  it('requests go to the runtime URL', async () => {
    window.__ENV__ = { VITE_API_URL: 'runtime.api' };
    const { apiRequest } = await loadClient('https://build.api');
    fetchMock.mockResolvedValue(jsonResponse({ ok: 1 }));
    await apiRequest('/patients');
    expect(fetchMock.mock.calls[0][0]).toBe('https://runtime.api/patients');
  });
});

describe('ApiError', () => {
  it('carries status, message and name', async () => {
    const { ApiError } = await loadClient('https://api.test');
    const e = new ApiError(418, 'teapot');
    expect(e).toBeInstanceOf(Error);
    expect(e.status).toBe(418);
    expect(e.message).toBe('teapot');
    expect(e.name).toBe('ApiError');
  });
});
