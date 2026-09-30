import {
  clearAuthStorage,
  getAuthToken,
  getRefreshToken,
  getTokenExpiresAt,
  setAuthNotice,
  setAuthTokens,
  type AuthTokens,
} from './auth-token';
import { emitAuthEvent } from './auth-events';
import { resolveApiUrl } from './runtime-config';

const baseUrl = resolveApiUrl();

/** Shown when the request never reached the server (offline, DNS, CORS, server down). */
export const NETWORK_ERROR_MESSAGE = "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring va qayta urinib ko'ring";

/** Shown on the login page after the session could not be refreshed. */
export const SESSION_EXPIRED_MESSAGE = 'Sessiya muddati tugagan, qayta kiring';

/** Refresh the access token this long before it expires (when `expires_in` is known). */
export const REFRESH_LEEWAY_MS = 60_000;

/**
 * Auth endpoints that must never trigger a refresh + retry (a 401 there is a real answer:
 * wrong password, invalid/reused refresh token). `/auth/me` and `/auth/password` are
 * normal authenticated requests and do refresh.
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 = network error (no response) */
    public status: number,
    message: string,
    /** backend `requestId` from the error body (for support / log lookup) */
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export type RequestOptions = RequestInit & { skipAuth?: boolean };

function buildUrl(path: string) {
  return path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function pathOf(path: string) {
  if (!path.startsWith('http')) return (path.startsWith('/') ? path : `/${path}`).split('?')[0];
  try {
    return new URL(path).pathname;
  } catch {
    return path;
  }
}

function isNoRefreshPath(path: string) {
  const p = pathOf(path);
  return NO_REFRESH_PATHS.some((x) => p === x || p.endsWith(x));
}

async function send(url: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else headers.delete('Authorization');
  try {
    return await fetch(url, { ...init, headers });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Backend/proxy ba'zan HTML yoki plaintext qaytarishi mumkin.
    // Shunda JSON.parse xato bo'lib, UI keskin yiqilib qolmasin.
    if (res.ok) throw new ApiError(res.status, 'Invalid JSON response');
    return { message: text } as Record<string, unknown>;
  }
}

function toApiError(res: Response, data: unknown): ApiError {
  const body = (data ?? {}) as Record<string, unknown>;
  const raw = body.message;
  const msg =
    typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.join('; ') : res.statusText || 'Request failed';
  const requestId = typeof body.requestId === 'string' ? body.requestId : undefined;
  return new ApiError(res.status, msg, requestId);
}

/** Clear the session, remember the reason for the login page and go there. */
export function expireSession(message = SESSION_EXPIRED_MESSAGE) {
  clearAuthStorage();
  setAuthNotice(message);
  emitAuthEvent({ type: 'expired' });
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

let refreshPromise: Promise<string> | null = null;

/** A refresh failure that means "the session is gone" (not a network hiccup / 5xx). */
function isSessionInvalid(err: unknown) {
  return err instanceof ApiError && err.status >= 400 && err.status < 500;
}

async function doRefresh(staleRefreshToken: string | null): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError(401, SESSION_EXPIRED_MESSAGE);
  // Another tab rotated the shared (localStorage) token while we waited for the lock:
  // reuse its result — sending our old token would count as reuse and revoke the family.
  const access = getAuthToken();
  if (staleRefreshToken && refreshToken !== staleRefreshToken && access) return access;

  const res = await send(buildUrl('/auth/refresh'), { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }, null);
  const data = (await parseBody(res).catch(() => null)) as (AuthTokens & Record<string, unknown>) | null;

  if (!res.ok || !data?.access_token) {
    // a tab without Web Locks support may have rotated it meanwhile
    const current = getRefreshToken();
    const currentAccess = getAuthToken();
    if (current && current !== refreshToken && currentAccess) return currentAccess;
    throw res.ok ? new ApiError(401, SESSION_EXPIRED_MESSAGE) : toApiError(res, data);
  }

  setAuthTokens(data); // same storage as before ("Eslab qolish")
  emitAuthEvent({ type: 'refreshed', accessToken: data.access_token });
  return data.access_token;
}

/** Serialize refreshes across tabs (Web Locks API) when the browser supports it. */
function withRefreshLock(fn: () => Promise<string>): Promise<string> {
  const locks = typeof navigator !== 'undefined' ? (navigator as Navigator & { locks?: LockManager }).locks : undefined;
  if (!locks?.request) return fn();
  return locks.request('zahro-auth-refresh', fn) as Promise<string>;
}

/**
 * Single-flight refresh: concurrent callers (several requests getting 401 at once)
 * share one `POST /auth/refresh` — important because the refresh token rotates and a
 * second call with the old one would be rejected as reuse.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const stale = getRefreshToken();
    refreshPromise = withRefreshLock(() => doRefresh(stale)).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function expiresSoon(now = Date.now()) {
  const exp = getTokenExpiresAt();
  return exp != null && exp - now < REFRESH_LEEWAY_MS && !!getRefreshToken();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = buildUrl(path);
  const refreshable = !skipAuth && !isNoRefreshPath(path);

  // proactive: renew shortly before expiry instead of waiting for a 401
  if (refreshable && expiresSoon()) {
    try {
      await refreshAccessToken();
    } catch (err) {
      if (isSessionInvalid(err)) {
        expireSession();
        throw new ApiError(401, SESSION_EXPIRED_MESSAGE);
      }
      // network / 5xx: try the request with the current token anyway
    }
  }

  const token = skipAuth ? null : getAuthToken();
  let res = await send(url, init, token);

  if (res.status === 401 && refreshable) {
    let retryToken: string | null = null;
    const current = getAuthToken();
    if (current && current !== token) {
      // a parallel request already refreshed while this one was in flight
      retryToken = current;
    } else if (getRefreshToken()) {
      try {
        retryToken = await refreshAccessToken();
      } catch (err) {
        if (!isSessionInvalid(err)) throw err; // offline / 5xx: keep the session, surface the error
      }
    }
    if (retryToken) res = await send(url, init, retryToken); // retried once — never loops
    if (res.status === 401) {
      await res.text().catch(() => '');
      expireSession();
      throw new ApiError(401, SESSION_EXPIRED_MESSAGE);
    }
  }

  const data = await parseBody(res);
  if (!res.ok) throw toApiError(res, data);
  return data as T;
}

export { baseUrl as apiBaseUrl };
