import { AUTH_TOKEN_KEY, AUTH_USER_KEY, clearAuthStorage, getAuthToken, setAuthToken } from './auth-token';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('auth-token', () => {
  it('uses stable storage keys', () => {
    expect(AUTH_TOKEN_KEY).toBe('zahro_token');
    expect(AUTH_USER_KEY).toBe('zahro_user');
  });

  describe('getAuthToken', () => {
    it('returns null when nothing is stored', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('prefers localStorage over sessionStorage', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'local');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'session');
      expect(getAuthToken()).toBe('local');
    });

    it('falls back to sessionStorage', () => {
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'session');
      expect(getAuthToken()).toBe('session');
    });

    it('returns null if storage access throws (e.g. privacy mode)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(getAuthToken()).toBeNull();
    });
  });

  describe('setAuthToken', () => {
    it('remember=true (default) stores in localStorage and removes the session copy', () => {
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'old');
      setAuthToken('tok');
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('tok');
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('remember=false stores in sessionStorage and removes the local copy', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'old');
      setAuthToken('tok', false);
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('tok');
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(getAuthToken()).toBe('tok');
    });

    it('null clears the token from both storages', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'a');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'b');
      setAuthToken(null);
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    });

    it('swallows storage errors (quota exceeded)', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => setAuthToken('tok')).not.toThrow();
    });
  });

  describe('clearAuthStorage', () => {
    it('removes token and user from both storages and leaves other keys', () => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'a');
      localStorage.setItem(AUTH_USER_KEY, '{}');
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'b');
      sessionStorage.setItem(AUTH_USER_KEY, '{}');
      localStorage.setItem('theme', 'dark');
      clearAuthStorage();
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
      expect(sessionStorage.getItem(AUTH_USER_KEY)).toBeNull();
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('swallows storage errors', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => clearAuthStorage()).not.toThrow();
    });
  });
});
