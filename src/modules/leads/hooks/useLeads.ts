import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import { Lead } from '@/shared/types';
import { useServerTable } from '@/shared/hooks/useServerTable';

export const useLeads = () => {
  const queryClient = useQueryClient();

  const table = useServerTable<Lead, { startDate?: string; endDate?: string; status?: string; source?: string }>({
    queryKey: ['leads'],
    fetchFn: (params) => leadsApi.list(params),
    perPage: 20,
  });

  const { setFilters } = table;
  /** Status select: "all" clears the filter. (setFilters is (key, value) — never pass an object.) */
  const setStatusFilter = useCallback(
    (status: string) => setFilters('status', status === 'all' ? undefined : status),
    [setFilters],
  );

  // For the Kanban board, we still might need all leads or just the ones from the table depending on mode.
  // Actually, table.data will hold the paginated leads.

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) => leadsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      // a converted lead creates a patient
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
      toast.success("Murojaat holati yangilandi");
    },
  });

  /** "Bemorga aylantirish": status → converted (the backend creates the patient). Errors are toasted globally. */
  const convertMut = useMutation({
    mutationFn: (id: string) => leadsApi.updateStatus(id, 'converted'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });

  const deleteMut = useMutation({
    mutationFn: leadsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Murojaat o'chirildi");
    },
  });

  return {
    leads: table.data,
    totalCount: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    search: table.search,
    setSearch: table.setSearch,
    sort: table.sort,
    setSort: table.setSort,
    filters: table.filters,
    setFilters: table.setFilters,
    setStatusFilter,
    isLoading: table.isLoading,
    error: table.error,
    refetch: table.refetch,
    updateStatus: updateStatusMut.mutate,
    isUpdating: updateStatusMut.isPending,
    convertToPatient: convertMut.mutate,
    isConverting: convertMut.isPending,
    createLead: useMutation({
      mutationFn: leadsApi.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success("Yangi murojaat qo'shildi");
      },
    }).mutate,
    updateLead: useMutation({
      mutationFn: ({ id, ...data }: Partial<Lead> & { id: string }) => leadsApi.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        toast.success("Murojaat yangilandi");
      },
    }).mutate,
    deleteLead: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
  };
};
