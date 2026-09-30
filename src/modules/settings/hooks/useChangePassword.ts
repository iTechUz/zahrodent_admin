import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, loginRequest } from '@/lib/api/endpoints';
import { expireSession } from '@/lib/api/client';
import { isSessionRemembered } from '@/lib/api/auth-token';
import { useStore } from '@/store/useStore';

export const PASSWORD_CHANGED_RELOGIN_MESSAGE = "Parol o'zgartirildi. Yangi parol bilan qayta kiring";

/**
 * PATCH /auth/password. The backend revokes every refresh token of the user on success,
 * so the current session could not be refreshed any more. To keep the user signed in we
 * log in again with the new password (fresh token pair, same "remember me" storage). If
 * that fails, the session ends with a clear message instead of a surprise 401 later.
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      await authApi.changePassword(body);
      const { currentUser, setSession } = useStore.getState();
      if (!currentUser?.phone) return { relogged: false };
      const remember = isSessionRemembered();
      try {
        const { user, ...tokens } = await loginRequest({ phone: currentUser.phone, password: body.newPassword });
        setSession(tokens, user, remember);
        return { relogged: true };
      } catch {
        return { relogged: false };
      }
    },
    onSuccess: ({ relogged }) => {
      if (relogged) {
        toast.success("Parol muvaffaqiyatli o'zgartirildi");
      } else {
        queryClient.clear();
        expireSession(PASSWORD_CHANGED_RELOGIN_MESSAGE);
      }
    },
    // the form shows the backend message inline ("Joriy parol noto'g'ri") — no global toast
    onError: () => {},
  });
}
