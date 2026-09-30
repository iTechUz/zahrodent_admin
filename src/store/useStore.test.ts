import { useStore } from './useStore';
import { makeUser } from '@/test/utils';
import { emitAuthEvent } from '@/lib/api/auth-events';

describe('useStore', () => {
  afterEach(() => useStore.getState().logout());

  it('combines the auth and app slices', () => {
    const s = useStore.getState();
    expect(typeof s.setSession).toBe('function');
    expect(typeof s.logout).toBe('function');
    expect(typeof s.toggleDarkMode).toBe('function');
    expect(s.darkMode).toBe(false);
  });

  it('auth actions do not reset app state', () => {
    useStore.setState({ darkMode: true });
    useStore.getState().setSession('t', makeUser('admin'));
    expect(useStore.getState().darkMode).toBe(true);
    expect(useStore.getState().isAuthenticated).toBe(true);
    useStore.setState({ darkMode: false });
  });

  it('a silent refresh ("refreshed" event) swaps the store token', () => {
    useStore.getState().setSession('old', makeUser('admin'));
    emitAuthEvent({ type: 'refreshed', accessToken: 'new' });
    expect(useStore.getState()).toMatchObject({ token: 'new', isAuthenticated: true });
  });

  it('an "expired" event logs out', () => {
    useStore.getState().setSession('old', makeUser('admin'));
    emitAuthEvent({ type: 'expired' });
    expect(useStore.getState()).toMatchObject({ token: null, currentUser: null, isAuthenticated: false });
  });

  it('ignores "refreshed" after logout', () => {
    useStore.getState().logout();
    emitAuthEvent({ type: 'refreshed', accessToken: 'late' });
    expect(useStore.getState().token).toBeNull();
  });
});
