import { create } from 'zustand';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_AT_KEY } from '@/lib/api/auth-token';
import { makeUser } from '@/test/utils';
import { createAuthSlice, type AuthSlice } from './authSlice';

const makeStore = () => create<AuthSlice>()(createAuthSlice);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('authSlice', () => {
  describe('initial state (rehydration)', () => {
    it('is logged out with empty storage', () => {
      const s = makeStore().getState();
      expect(s).toMatchObject({ token: null, currentUser: null, isAuthenticated: false });
    });

    it('restores token + user from localStorage', () => {
      const user = makeUser('doctor', { doctorId: 'd1' });
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      expect(makeStore().getState()).toMatchObject({ token: 'tok', currentUser: user, isAuthenticated: true });
    });

    it('restores a non-remembered session from sessionStorage', () => {
      const user = makeUser('receptionist');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      expect(makeStore().getState()).toMatchObject({ token: 'tok', currentUser: user, isAuthenticated: true });
    });

    it('stays logged out when only the token (no user) is stored', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      expect(makeStore().getState().isAuthenticated).toBe(false);
    });

    it('stays logged out (pending /auth/me) when the stored user JSON is corrupt', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      localStorage.setItem(AUTH_USER_KEY, '{not json');
      expect(makeStore().getState()).toMatchObject({
        token: 'tok',
        currentUser: null,
        isAuthenticated: false,
        authReady: false,
      });
    });

    it('a token without a cached user waits for /auth/me (authReady=false)', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      expect(makeStore().getState()).toMatchObject({ token: 'tok', isAuthenticated: false, authReady: false });
    });

    it('is ready immediately with empty storage or a cached session', () => {
      expect(makeStore().getState().authReady).toBe(true);
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(makeUser('admin')));
      expect(makeStore().getState().authReady).toBe(true);
    });
  });

  describe('setSession', () => {
    it('remember=true (default) persists to localStorage', () => {
      const store = makeStore();
      const user = makeUser('admin');
      sessionStorage.setItem(AUTH_USER_KEY, 'stale');
      store.getState().setSession('tok', user);
      expect(store.getState()).toMatchObject({ token: 'tok', currentUser: user, isAuthenticated: true });
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('tok');
      expect(JSON.parse(localStorage.getItem(AUTH_USER_KEY)!)).toEqual(user);
      expect(sessionStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('remember=false persists to sessionStorage only', () => {
      const store = makeStore();
      const user = makeUser('doctor');
      localStorage.setItem(AUTH_USER_KEY, 'stale');
      localStorage.setItem(AUTH_TOKEN_KEY, 'stale');
      store.getState().setSession('tok', user, false);
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('tok');
      expect(JSON.parse(sessionStorage.getItem(AUTH_USER_KEY)!)).toEqual(user);
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(store.getState().isAuthenticated).toBe(true);
    });

    it('stores access + refresh token and expiry from a login response', () => {
      const store = makeStore();
      vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
      store.getState().setSession({ access_token: 'a1', refresh_token: 'r1', expires_in: 900 }, makeUser('admin'));
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('a1');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('r1');
      expect(localStorage.getItem(TOKEN_EXPIRES_AT_KEY)).toBe(String(1_000_000 + 900_000));
      expect(store.getState().token).toBe('a1');
      vi.restoreAllMocks();
    });

    it('remember=false keeps the refresh token in sessionStorage too', () => {
      makeStore().getState().setSession({ access_token: 'a1', refresh_token: 'r1' }, makeUser('admin'), false);
      expect(sessionStorage.getItem(REFRESH_TOKEN_KEY)).toBe('r1');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    });

    it('a new login drops the previous refresh token', () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, 'old');
      makeStore().getState().setSession({ access_token: 'a2' }, makeUser('admin'));
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    });

    it('a remembered session survives a "reload" (new store)', () => {
      makeStore().getState().setSession('tok', makeUser('admin'));
      expect(makeStore().getState().isAuthenticated).toBe(true);
    });
  });

  describe('setUser / setAccessToken', () => {
    it('setUser stores the /auth/me user in the storage the session lives in', () => {
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      const store = makeStore();
      const me = makeUser('doctor', { doctorId: 'd1' });
      store.getState().setUser(me);
      expect(JSON.parse(sessionStorage.getItem(AUTH_USER_KEY)!)).toEqual(me);
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(store.getState()).toMatchObject({ currentUser: me, isAuthenticated: true, authReady: true });
    });

    it('setAccessToken only swaps the token', () => {
      const store = makeStore();
      store.getState().setSession('tok', makeUser('admin'));
      store.getState().setAccessToken('tok-2');
      expect(store.getState()).toMatchObject({ token: 'tok-2', isAuthenticated: true });
    });
  });

  describe('logout', () => {
    it('clears state and both storages', () => {
      const store = makeStore();
      store.getState().setSession('tok', makeUser('admin'));
      store.getState().logout();
      expect(store.getState()).toMatchObject({ token: null, currentUser: null, isAuthenticated: false });
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_USER_KEY)).toBeNull();
    });
  });
});
