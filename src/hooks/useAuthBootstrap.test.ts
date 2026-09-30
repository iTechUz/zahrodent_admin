import { renderHook, waitFor } from '@testing-library/react';
import { useStore } from '@/store/useStore';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/api/auth-token';
import { authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { resetApiMock } from '@/test/api-mock';
import { makeUser } from '@/test/utils';
import { useAuthBootstrap } from './useAuthBootstrap';

vi.mock('@/lib/api/endpoints', async () => (await import('@/test/api-mock')).apiMock);

beforeEach(() => {
  resetApiMock();
  localStorage.clear();
  sessionStorage.clear();
});

describe('useAuthBootstrap', () => {
  it('does nothing without a stored token', () => {
    useStore.setState({ token: null, currentUser: null, isAuthenticated: false, authReady: true });
    const { result } = renderHook(() => useAuthBootstrap());
    expect(authApi.me).not.toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  it('restores the user from GET /auth/me (not only from storage)', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
    const cached = makeUser('receptionist', { name: 'Eski ism', avatar: 'a.png' });
    useStore.setState({ token: 'tok', currentUser: cached, isAuthenticated: true, authReady: true });
    const me = { id: cached.id, name: 'Yangi ism', phone: cached.phone, role: 'admin' as const, doctorId: undefined };
    vi.mocked(authApi.me).mockResolvedValue(me);

    renderHook(() => useAuthBootstrap());

    await waitFor(() => expect(useStore.getState().currentUser?.name).toBe('Yangi ism'));
    expect(useStore.getState().currentUser).toMatchObject({ role: 'admin', avatar: 'a.png' });
    expect(JSON.parse(localStorage.getItem(AUTH_USER_KEY)!)).toMatchObject({ name: 'Yangi ism', role: 'admin' });
  });

  it('a token without a cached user: not ready until /auth/me answers', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
    useStore.setState({ token: 'tok', currentUser: null, isAuthenticated: false, authReady: false });
    let resolve!: (u: ReturnType<typeof makeUser>) => void;
    vi.mocked(authApi.me).mockReturnValue(new Promise((r) => (resolve = r)));

    const { result } = renderHook(() => useAuthBootstrap());
    expect(result.current).toBe(false);

    resolve(makeUser('doctor', { doctorId: 'd1' }));
    await waitFor(() => expect(result.current).toBe(true));
    expect(useStore.getState()).toMatchObject({ isAuthenticated: true, currentUser: { role: 'doctor', doctorId: 'd1' } });
  });

  it('offline on start without a cached user → ready (login page), tokens untouched', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
    useStore.setState({ token: 'tok', currentUser: null, isAuthenticated: false, authReady: false });
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(0, 'offline'));

    const { result } = renderHook(() => useAuthBootstrap());

    await waitFor(() => expect(result.current).toBe(true));
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('tok');
  });

  it('offline on start with a cached user keeps the session', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
    useStore.setState({ token: 'tok', currentUser: makeUser('admin'), isAuthenticated: true, authReady: true });
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(0, 'offline'));
    renderHook(() => useAuthBootstrap());
    await waitFor(() => expect(authApi.me).toHaveBeenCalled());
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('calls /auth/me only once per page load', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, 'tok');
    useStore.setState({ token: 'tok', currentUser: makeUser('admin'), isAuthenticated: true, authReady: true });
    vi.mocked(authApi.me).mockResolvedValue(makeUser('admin'));
    const { rerender } = renderHook(() => useAuthBootstrap());
    rerender();
    rerender();
    await waitFor(() => expect(authApi.me).toHaveBeenCalledTimes(1));
  });
});
