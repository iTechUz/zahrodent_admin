import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { authApi } from '@/lib/api/endpoints';
import { getRefreshToken } from '@/lib/api/auth-token';

/**
 * Logout: revoke the refresh token on the server (`POST /auth/logout`), then clear the
 * local session and the query cache. The UI does not wait for the request — a slow or
 * offline server must not keep the user logged in; the refresh token is cleared locally
 * either way.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useStore((s) => s.logout);

  return () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      void authApi.logout(refreshToken).catch(() => {
        /* already invalid / offline — nothing to do */
      });
    }
    queryClient.clear();
    logout();
  };
}
