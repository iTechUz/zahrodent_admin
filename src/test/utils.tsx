import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import type { SessionUser, UserRole } from '@/shared/types/auth';

/** Fresh QueryClient per test: no retries, no cache sharing between tests. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(queryClient = createTestQueryClient(), { router = false, route = '/' } = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const tree = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    return router ? <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{tree}</MemoryRouter> : tree;
  };
  return { queryClient, wrapper: Wrapper };
}

export function makeUser(role: UserRole = 'admin', extra: Partial<SessionUser> = {}): SessionUser {
  return { id: `u-${role}`, name: `${role} user`, phone: '+998901112233', role, ...extra };
}

/** Put the zustand store into an authenticated (or anonymous) state. */
export function loginAs(role: UserRole | null, extra: Partial<SessionUser> = {}) {
  if (role === null) {
    useStore.setState({ token: null, currentUser: null, isAuthenticated: false });
    return;
  }
  useStore.setState({ token: 'test-token', currentUser: makeUser(role, extra), isAuthenticated: true });
}

export function paginated<T>(data: T[], total = data.length) {
  return { data, total };
}

/** `YYYY-MM-DD` for a local date (matches how the app builds month keys). */
export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
