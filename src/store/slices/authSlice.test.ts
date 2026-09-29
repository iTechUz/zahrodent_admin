import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '@/store/useStore';
import { mockUsers } from '@/mock/users';
import { resetStore } from '@/test/resetStore';

describe('authSlice', () => {
  beforeEach(resetStore);

  it('starts logged out', () => {
    const s = useStore.getState();
    expect(s.currentUser).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it.each(mockUsers.map((u) => [u.role, u] as const))('login stores a %s user', (_role, user) => {
    useStore.getState().login(user);
    const s = useStore.getState();
    expect(s.currentUser).toBe(user);
    expect(s.isAuthenticated).toBe(true);
  });

  it('login replaces a previously logged-in user', () => {
    useStore.getState().login(mockUsers[0]);
    useStore.getState().login(mockUsers[3]);
    expect(useStore.getState().currentUser?.id).toBe('u4');
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('logout clears the user', () => {
    useStore.getState().login(mockUsers[1]);
    useStore.getState().logout();
    const s = useStore.getState();
    expect(s.currentUser).toBeNull();
    expect(s.isAuthenticated).toBe(false);
  });

  it('logout when already logged out is a no-op', () => {
    useStore.getState().logout();
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(useStore.getState().currentUser).toBeNull();
  });

  it('auth actions do not touch other slices', () => {
    const before = useStore.getState().patients;
    useStore.getState().login(mockUsers[0]);
    useStore.getState().logout();
    expect(useStore.getState().patients).toBe(before);
  });
});
