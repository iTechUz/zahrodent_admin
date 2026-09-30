export const AUTH_TOKEN_KEY = 'zahro_token';
export const AUTH_USER_KEY = 'zahro_user';
export const REFRESH_TOKEN_KEY = 'zahro_refresh';
/** Access-token expiry as epoch ms (from the login/refresh `expires_in`). */
export const TOKEN_EXPIRES_AT_KEY = 'zahro_token_exp';

const SESSION_KEYS = [AUTH_TOKEN_KEY, AUTH_USER_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_AT_KEY];

/** Login / refresh response (backend `POST /auth/login`, `POST /auth/refresh`). */
export interface AuthTokens {
  access_token: string;
  /** Rotated on every refresh — the old one becomes invalid. */
  refresh_token?: string;
  /** Access-token lifetime in seconds. */
  expires_in?: number;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return read(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return read(REFRESH_TOKEN_KEY);
}

/** Epoch ms when the access token expires, or null when unknown. */
export function getTokenExpiresAt(): number | null {
  const raw = read(TOKEN_EXPIRES_AT_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * "Eslab qolish": the session lives in localStorage (survives a browser restart) or
 * sessionStorage (this tab only). A refresh keeps the session where it already is.
 */
export function isSessionRemembered(): boolean {
  try {
    if (localStorage.getItem(AUTH_TOKEN_KEY)) return true;
    if (sessionStorage.getItem(AUTH_TOKEN_KEY)) return false;
  } catch {
    /* ignore */
  }
  return true;
}

function write(key: string, value: string | null, remember: boolean) {
  const [target, other] = remember ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  other.removeItem(key);
  if (value == null) target.removeItem(key);
  else target.setItem(key, value);
}

export function setAuthToken(token: string | null, remember: boolean = true) {
  try {
    if (token) {
      write(AUTH_TOKEN_KEY, token, remember);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** Stores access + refresh token (+ expiry) in one storage; `remember` defaults to the current session's storage. */
export function setAuthTokens(tokens: AuthTokens, remember: boolean = isSessionRemembered(), now = Date.now()) {
  setAuthToken(tokens.access_token, remember);
  try {
    if (tokens.refresh_token) write(REFRESH_TOKEN_KEY, tokens.refresh_token, remember);
    const exp =
      typeof tokens.expires_in === 'number' && tokens.expires_in > 0 ? String(now + tokens.expires_in * 1000) : null;
    write(TOKEN_EXPIRES_AT_KEY, exp, remember);
  } catch {
    /* ignore */
  }
}

export function clearAuthStorage() {
  try {
    for (const key of SESSION_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Message for the login page (e.g. "session expired"). It survives the hard redirect
 * and stays until the next successful login — the SPA may render /login once before
 * the reload, so reading it must not consume it.
 */
export const AUTH_NOTICE_KEY = 'zahro_auth_notice';

export function setAuthNotice(message: string) {
  try {
    sessionStorage.setItem(AUTH_NOTICE_KEY, message);
  } catch {
    /* ignore */
  }
}

export function getAuthNotice(): string | null {
  try {
    return sessionStorage.getItem(AUTH_NOTICE_KEY);
  } catch {
    return null;
  }
}

export function clearAuthNotice() {
  try {
    sessionStorage.removeItem(AUTH_NOTICE_KEY);
  } catch {
    /* ignore */
  }
}
