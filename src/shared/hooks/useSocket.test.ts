import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { createWrapper } from '@/test/utils';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

type Handler = (...args: unknown[]) => void;

function makeFakeSocket() {
  const handlers = new Map<string, Handler[]>();
  return {
    handlers,
    on: vi.fn((ev: string, cb: Handler) => {
      handlers.set(ev, [...(handlers.get(ev) ?? []), cb]);
    }),
    off: vi.fn((ev: string, cb: Handler) => {
      handlers.set(ev, (handlers.get(ev) ?? []).filter((h) => h !== cb));
    }),
    disconnect: vi.fn(),
    emit(ev: string, ...args: unknown[]) {
      (handlers.get(ev) ?? []).forEach((h) => h(...args));
    },
  };
}

let fake: ReturnType<typeof makeFakeSocket>;

function authed(token = 'jwt-1', role: 'admin' | 'doctor' | 'receptionist' = 'admin') {
  return { isAuthenticated: true, token, currentUser: { id: 'u', name: 'U', phone: '+998900000000', role } };
}

async function loadHook() {
  // the hook keeps the socket in module scope — reload it per test
  vi.resetModules();
  const mod = await import('./useSocket');
  const { useStore } = await import('@/store/useStore');
  return { useSocket: mod.useSocket, useStore };
}

beforeEach(() => {
  vi.clearAllMocks();
  fake = makeFakeSocket();
  vi.mocked(io).mockReturnValue(fake as never);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('useSocket', () => {
  it('does not connect while logged out', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: false, currentUser: null, token: null });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSocket(), { wrapper });
    expect(io).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('connects to VITE_API_URL over websocket when authenticated', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.zahro.test');
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    const { wrapper } = createWrapper();
    renderHook(() => useSocket(), { wrapper });
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith('https://api.zahro.test', {
      transports: ['websocket'],
      auth: { token: 'jwt-1' },
    });
    expect(fake.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(fake.on).toHaveBeenCalledWith('newLead', expect.any(Function));
  });

  it('falls back to http://localhost:3000', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    expect(io).toHaveBeenCalledWith('http://localhost:3000', { transports: ['websocket'], auth: { token: 'jwt-1' } });
  });

  it('reuses one socket across multiple consumers', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    const { wrapper } = createWrapper();
    renderHook(() => useSocket(), { wrapper });
    renderHook(() => useSocket(), { wrapper });
    expect(io).toHaveBeenCalledTimes(1);
  });

  it('on "newLead" invalidates the leads query and shows a toast', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    const { wrapper, queryClient } = createWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    renderHook(() => useSocket(), { wrapper });

    fake.emit('newLead', { id: 'l1', name: 'Ali', phone: '+998901112233' });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leads'] });
    expect(toast.info).toHaveBeenCalledWith(
      'Yangi murojaat: Ali',
      expect.objectContaining({ description: '+998901112233', action: expect.objectContaining({ label: "Ko'rish" }) }),
    );
  });

  it('"Ko\'rish" on the lead toast calls onOpenLead', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    const onOpenLead = vi.fn();
    renderHook(() => useSocket({ onOpenLead }), { wrapper: createWrapper().wrapper });
    fake.emit('newLead', { id: 'l1', name: 'Ali', phone: '+998901112233' });
    const opts = vi.mocked(toast.info).mock.calls[0][1] as unknown as { action: { onClick: () => void } };
    opts.action.onClick();
    expect(onOpenLead).toHaveBeenCalledWith(expect.objectContaining({ id: 'l1' }));
  });

  it('doctors (no access to leads) get no lead toast', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed('jwt-d', 'doctor'));
    renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    fake.emit('newLead', { id: 'l1', name: 'Ali', phone: '+998901112233' });
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('removes its newLead listener on unmount', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    const { unmount } = renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    const handler = fake.handlers.get('newLead')![0];
    unmount();
    expect(fake.off).toHaveBeenCalledWith('newLead', handler);
    expect(fake.handlers.get('newLead')).toEqual([]);
  });

  it('disconnects an existing socket when mounted while logged out', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed());
    const { wrapper } = createWrapper();
    const first = renderHook(() => useSocket(), { wrapper });
    first.unmount();
    useStore.setState({ isAuthenticated: false });
    renderHook(() => useSocket(), { wrapper });
    expect(fake.disconnect).toHaveBeenCalledTimes(1);
  });

  it('connects after a login that happens while mounted, and disconnects on logout', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: false, currentUser: null, token: null });
    const { result } = renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    expect(io).not.toHaveBeenCalled();

    act(() => useStore.setState(authed('jwt-login')));
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'jwt-login' } }));
    expect(result.current).toBe(fake);

    act(() => useStore.setState({ isAuthenticated: false, currentUser: null, token: null }));
    expect(fake.disconnect).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull();
  });

  it('reconnects with the new token when a different user logs in', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed('jwt-a'));
    renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    const first = fake;
    fake = makeFakeSocket();
    vi.mocked(io).mockReturnValue(fake as never);
    act(() => useStore.setState(authed('jwt-b')));
    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'jwt-b' } }));
  });

  it('reconnects with the new access token after a silent refresh (same user)', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState(authed('jwt-old'));
    const { result } = renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    const first = fake;
    fake = makeFakeSocket();
    vi.mocked(io).mockReturnValue(fake as never);

    act(() => useStore.getState().setAccessToken('jwt-refreshed'));

    expect(first.disconnect).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ auth: { token: 'jwt-refreshed' } }));
    expect(result.current).toBe(fake);
    expect(fake.handlers.get('newLead')).toHaveLength(1);
  });

  it('server-side disconnect (token rejected) triggers one refresh', async () => {
    const { useSocket, useStore } = await loadHook();
    const client = await import('@/lib/api/client');
    const refresh = vi.spyOn(client, 'refreshAccessToken').mockResolvedValue('jwt-new');
    useStore.setState(authed('jwt-a'));
    renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });

    fake.emit('disconnect', 'io server disconnect');
    fake.emit('disconnect', 'io server disconnect');
    fake.emit('disconnect', 'transport close');

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
