import { create } from 'zustand';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/api/auth-token';
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

    it('stays logged out when the stored user JSON is corrupt', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
      localStorage.setItem(AUTH_USER_KEY, '{not json');
      expect(makeStore().getState()).toMatchObject({ token: null, currentUser: null, isAuthenticated: false });
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

    it('a remembered session survives a "reload" (new store)', () => {
      makeStore().getState().setSession('tok', makeUser('admin'));
      expect(makeStore().getState().isAuthenticated).toBe(true);
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
