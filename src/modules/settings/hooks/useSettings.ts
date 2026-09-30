import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { settingsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { useStore } from '@/store/useStore';
import { can } from '@/shared/config/roles';
import type { ClinicSettings } from '@/shared/types';

/** GET /settings (every staff role) + PATCH /settings (admin, partial). */
export function useSettings() {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsApi.get(),
    enabled: authed,
    meta: { silentError: true }, // the page renders its own error state
  });

  const mutation = useMutation({
    mutationFn: (body: Partial<ClinicSettings>) => settingsApi.update(body),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.settings, saved);
      toast.success('Sozlamalar saqlandi');
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    canEdit: can(role, 'settings.update'),
    save: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
