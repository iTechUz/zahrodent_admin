import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from './auth-token';

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
    it('clears token + user from both storages and redirects to /login', async () => {
      const { apiRequest, ApiError } = await loadClient('https://api.test');
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      localStorage.setItem(AUTH_USER_KEY, '{}');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'tok2');
      sessionStorage.setItem(AUTH_USER_KEY, '{}');
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, { status: 401 }));

      const err = await apiRequest('/patients').catch((e) => e);

      expect(err).toBeInstanceOf(ApiError);
      expect(err).toMatchObject({ status: 401, message: 'Unauthorized' });
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_USER_KEY)).toBeNull();
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

  describe('network errors', () => {
    it('propagates fetch rejections (offline / CORS) unchanged', async () => {
      const { apiRequest, ApiError } = await loadClient('https://api.test');
      const netErr = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValue(netErr);
      const err = await apiRequest('/x').catch((e) => e);
      expect(err).toBe(netErr);
      expect(err).not.toBeInstanceOf(ApiError);
    });
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
