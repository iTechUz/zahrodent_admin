import { act, renderHook } from '@testing-library/react';
import { useStore } from '@/store/useStore';
import { createWrapper, loginAs } from '@/test/utils';
import { REFRESH_TOKEN_KEY } from '@/lib/api/auth-token';
import { authApi } from '@/lib/api/endpoints';
import { resetApiMock } from '@/test/api-mock';
import { useLogout } from './useLogout';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

beforeEach(() => {
  resetApiMock();
  localStorage.clear();
  sessionStorage.clear();
});

describe('useLogout', () => {
  it('clears the React Query cache and the auth session', () => {
    loginAs('admin');
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(['patients'], { data: [], total: 0 });
    const { result } = renderHook(() => useLogout(), { wrapper });

    act(() => result.current());

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(useStore.getState()).toMatchObject({ isAuthenticated: false, currentUser: null, token: null });
  });

  it('revokes the refresh token on the server (POST /auth/logout) before clearing it locally', () => {
    loginAs('admin');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'rt-1');
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper().wrapper });

    act(() => result.current());

    expect(authApi.logout).toHaveBeenCalledWith('rt-1');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('logs out locally even when the server call fails', async () => {
    loginAs('admin');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'rt-1');
    vi.mocked(authApi.logout).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper().wrapper });

    act(() => result.current());
    await Promise.resolve();

    expect(useStore.getState().isAuthenticated).toBe(false);
  });

  it('skips the server call without a refresh token', () => {
    loginAs('admin');
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper().wrapper });
    act(() => result.current());
    expect(authApi.logout).not.toHaveBeenCalled();
  });
});
