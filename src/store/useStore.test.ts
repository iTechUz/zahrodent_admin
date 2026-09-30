import { useStore } from './useStore';
import { makeUser } from '@/test/utils';

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
});
