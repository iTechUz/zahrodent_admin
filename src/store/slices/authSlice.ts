import { StateCreator } from 'zustand';
import {
  AUTH_USER_KEY,
  clearAuthNotice,
  clearAuthStorage,
  getAuthToken,
  isSessionRemembered,
  setAuthTokens,
  type AuthTokens,
} from '@/lib/api/auth-token';
import type { SessionUser } from '@/shared/types/auth';

function readPersisted(): {
  token: string | null;
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  authReady: boolean;
} {
  let token: string | null = null;
  try {
    token = getAuthToken();
    const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
    if (token && raw) {
      // optimistic: the cached user renders immediately, /auth/me (useAuthBootstrap) confirms it
      return { token, currentUser: JSON.parse(raw) as SessionUser, isAuthenticated: true, authReady: true };
    }
  } catch {
    /* ignore — corrupt user JSON: fall through */
  }
  // a token without a (valid) cached user: wait for /auth/me before deciding
  if (token) return { token, currentUser: null, isAuthenticated: false, authReady: false };
  return { token: null, currentUser: null, isAuthenticated: false, authReady: true };
}

function persistUser(user: SessionUser, remember: boolean) {
  try {
    const [target, other] = remember ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
    other.removeItem(AUTH_USER_KEY);
    target.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export type { SessionUser };

export interface AuthSlice {
  /** current access token (kept in sync with storage by the silent refresh) */
  token: string | null;
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  /** false while a stored token is being verified with GET /auth/me (no cached user) */
  authReady: boolean;
  /** After login: tokens (or a bare access token) + user; `remember` = localStorage vs sessionStorage. */
  setSession: (tokens: AuthTokens | string, user: SessionUser, remember?: boolean) => void;
  /** GET /auth/me result — stored where the session already lives. */
  setUser: (user: SessionUser) => void;
  /** Silent refresh obtained a new access token (storage is already updated by the client). */
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  ...readPersisted(),
  setSession: (tokens, user, remember = true) => {
    const t: AuthTokens = typeof tokens === 'string' ? { access_token: tokens } : tokens;
    // a new login must not inherit the previous session's refresh token / expiry
    clearAuthStorage();
    clearAuthNotice();
    setAuthTokens(t, remember);
    persistUser(user, remember);
    set({ token: t.access_token, currentUser: user, isAuthenticated: true, authReady: true });
  },
  setUser: (user) => {
    persistUser(user, isSessionRemembered());
    set({ currentUser: user, isAuthenticated: true, authReady: true });
  },
  setAccessToken: (token) => set({ token }),
  logout: () => {
    clearAuthStorage();
    set({ token: null, currentUser: null, isAuthenticated: false, authReady: true });
  },
});
