/**
 * "Return to where you were" after the session expired / the user had to log in.
 * The path is kept in sessionStorage (per tab) and only ever used as an in-app relative path —
 * `safeReturnPath` rejects anything that could leave the origin (open redirect).
 */
const RETURN_TO_KEY = 'zahro_return_to';
const MAX_LENGTH = 512;

/**
 * Returns `raw` if it is a same-origin relative path ("/patients/12?tab=a"), otherwise null.
 * Rejects absolute / protocol-relative URLs ("//evil.com", "https://…", "/\evil.com"), `javascript:` etc.,
 * control characters, and the login page itself (redirect loop).
 */
export function safeReturnPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_LENGTH) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    // must resolve to the same origin as a dummy base — catches anything the checks above missed
    const base = 'http://app.invalid';
    if (new URL(raw, base).origin !== base) return null;
  } catch {
    return null;
  }
  const pathname = raw.split(/[?#]/)[0];
  if (pathname === '/login' || pathname.startsWith('/login/')) return null;
  return raw;
}

export function rememberReturnPath(path: unknown): void {
  const safe = safeReturnPath(path);
  try {
    if (safe) sessionStorage.setItem(RETURN_TO_KEY, safe);
  } catch {
    /* storage unavailable (private mode) — fall back to "/" after login */
  }
}

/** Reads the remembered path without clearing it (safe to call during render). */
export function peekReturnPath(): string | null {
  try {
    return safeReturnPath(sessionStorage.getItem(RETURN_TO_KEY));
  } catch {
    return null;
  }
}

export function clearReturnPath(): void {
  try {
    sessionStorage.removeItem(RETURN_TO_KEY);
  } catch {
    /* ignore */
  }
}

/** Reads and clears the remembered path (valid or not — an invalid one must not linger). */
export function takeReturnPath(): string | null {
  try {
    const raw = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return safeReturnPath(raw);
  } catch {
    return null;
  }
}

/** Registered by the router so an expired session can navigate without a full page reload. */
let spaRedirectToLogin: (() => void) | null = null;
export function registerLoginRedirect(fn: (() => void) | null): void {
  spaRedirectToLogin = fn;
}
export function redirectToLogin(): void {
  if (spaRedirectToLogin) spaRedirectToLogin();
  else if (typeof window !== 'undefined') window.location.assign('/login');
}
