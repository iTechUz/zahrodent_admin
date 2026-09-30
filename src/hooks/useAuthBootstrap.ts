import { useEffect, useRef } from 'react';
import { authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { getAuthToken } from '@/lib/api/auth-token';
import { useStore } from '@/store/useStore';

/**
 * On app start with a stored token, confirm the session with `GET /auth/me` instead of
 * trusting only the cached user in storage (role/name may have changed, the user may be
 * deleted). An expired access token is refreshed transparently by the API client; if
 * that fails the client logs out and redirects to /login.
 *
 * Runs once per page load. Returns `authReady` — false while there is a token but no
 * cached user yet (the app shows a loading screen instead of bouncing to /login).
 */
export function useAuthBootstrap(): boolean {
  const authReady = useStore((s) => s.authReady);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!getAuthToken()) return;

    authApi
      .me()
      .then((me) => {
        const s = useStore.getState();
        if (!s.token) return; // logged out meanwhile
        // keep optional profile fields (avatar, specialty) the cached copy may have
        s.setUser({ ...(s.currentUser ?? {}), ...me });
      })
      .catch((err: unknown) => {
        const s = useStore.getState();
        if (err instanceof ApiError && err.status === 401) return; // client already expired the session
        // offline / 5xx: keep a cached session; without one, fall back to the login page
        if (!s.authReady) useStore.setState({ authReady: true });
      });
  }, []);

  return authReady;
}
