import { act, renderHook } from '@testing-library/react';
import { useStore } from '@/store/useStore';
import { createWrapper, loginAs } from '@/test/utils';
import { useLogout } from './useLogout';

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
});
