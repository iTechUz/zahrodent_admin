import { clearAuthStorage, getAuthToken } from './auth-token';
import { resolveApiUrl } from './runtime-config';

const baseUrl = resolveApiUrl();

/** Shown when the request never reached the server (offline, DNS, CORS, server down). */
export const NETWORK_ERROR_MESSAGE = "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring va qayta urinib ko'ring";

export class ApiError extends Error {
  constructor(
    /** HTTP status; 0 = network error (no response) */
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

export type RequestOptions = RequestInit & { skipAuth?: boolean };

function clearSessionStorage() {
  clearAuthStorage();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      // Backend/proxy ba'zan HTML yoki plaintext qaytarishi mumkin.
      // Shunda JSON.parse xato bo'lib, UI keskin yiqilib qolmasin.
      if (res.ok) {
        throw new ApiError(res.status, 'Invalid JSON response');
      }
      data = { message: text } as Record<string, unknown>;
    }
  }

  if (!res.ok) {
    const raw = (data as Record<string, unknown> | null | undefined)?.message;
    const msg =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.join('; ')
          : res.statusText || 'Request failed';
    if (res.status === 401) {
      clearSessionStorage();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    throw new ApiError(res.status, msg);
  }

  return data as T;
}

export { baseUrl as apiBaseUrl };
