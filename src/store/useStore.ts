import { create } from 'zustand';
import { onAuthEvent } from '@/lib/api/auth-events';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createAppSlice, AppSlice } from './slices/appSlice';

export type StoreState = AuthSlice & AppSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createAppSlice(...a),
}));

// HTTP client → store: silent refresh updates the token (the socket reconnects with it),
// an unrecoverable 401 logs out.
onAuthEvent((event) => {
  const s = useStore.getState();
  if (event.type === 'refreshed') {
    if (s.isAuthenticated || !s.authReady) s.setAccessToken(event.accessToken);
  } else if (s.token || s.isAuthenticated) {
    s.logout();
  }
});
