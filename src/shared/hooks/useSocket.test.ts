import { renderHook } from '@testing-library/react';
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
    useStore.setState({ isAuthenticated: true });
    const { wrapper } = createWrapper();
    renderHook(() => useSocket(), { wrapper });
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith('https://api.zahro.test', { transports: ['websocket'] });
    expect(fake.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(fake.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(fake.on).toHaveBeenCalledWith('newLead', expect.any(Function));
  });

  it('falls back to http://localhost:3000', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: true });
    renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    expect(io).toHaveBeenCalledWith('http://localhost:3000', { transports: ['websocket'] });
  });

  it('reuses one socket across multiple consumers', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: true });
    const { wrapper } = createWrapper();
    renderHook(() => useSocket(), { wrapper });
    renderHook(() => useSocket(), { wrapper });
    expect(io).toHaveBeenCalledTimes(1);
  });

  it('on "newLead" invalidates the leads query and shows a toast', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: true });
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

  it('removes its newLead listener on unmount', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: true });
    const { unmount } = renderHook(() => useSocket(), { wrapper: createWrapper().wrapper });
    const handler = fake.handlers.get('newLead')![0];
    unmount();
    expect(fake.off).toHaveBeenCalledWith('newLead', handler);
    expect(fake.handlers.get('newLead')).toEqual([]);
  });

  it('disconnects an existing socket when mounted while logged out', async () => {
    const { useSocket, useStore } = await loadHook();
    useStore.setState({ isAuthenticated: true });
    const { wrapper } = createWrapper();
    const first = renderHook(() => useSocket(), { wrapper });
    first.unmount();
    useStore.setState({ isAuthenticated: false });
    renderHook(() => useSocket(), { wrapper });
    expect(fake.disconnect).toHaveBeenCalledTimes(1);
  });

  it.todo(
    'BUG: src/shared/hooks/useSocket.ts:57 — effect deps are only [queryClient], so logging out (isAuthenticated → false) ' +
      'does not disconnect the socket and logging in after mount never connects until remount; deps should include isAuthenticated',
  );
});
