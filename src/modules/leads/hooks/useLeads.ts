import { useCallback } from 'react';
import { useMutation, useQueries, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import { Lead, LeadStatus } from '@/shared/types';
import { useServerTable } from '@/shared/hooks/useServerTable';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'consultation', 'proposal', 'converted', 'cancelled'];

type LeadsPage = { data: Lead[]; total: number };
type Snapshot = [QueryKey, unknown][];

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

  // Real per-status totals (the board only holds one page): one limit=1 request per status, filtered like the
  // board (search/source/dates) but NOT by status.
  const countParams = {
    search: table.appliedSearch,
    ...(table.filters.source ? { source: table.filters.source } : {}),
    ...(table.filters.startDate ? { startDate: table.filters.startDate } : {}),
    ...(table.filters.endDate ? { endDate: table.filters.endDate } : {}),
  };
  const statusCounts = useQueries({
    queries: LEAD_STATUSES.map((status) => ({
      queryKey: ['leads', 'counts', status, countParams],
      queryFn: () => leadsApi.list({ ...countParams, status, page: 0, limit: 1 }),
      staleTime: 15_000,
    })),
    combine: (results) =>
      Object.fromEntries(LEAD_STATUSES.map((st, i) => [st, results[i].data?.total])) as Record<
        LeadStatus,
        number | undefined
      >,
  });

  /** Moves the card at once; the snapshot lets `rollback` restore the board if the server refuses. */
  const applyOptimisticStatus = async (id: string, status: LeadStatus): Promise<Snapshot> => {
    await queryClient.cancelQueries({ queryKey: ['leads', 'list'] });
    const snapshot = queryClient.getQueriesData<LeadsPage>({ queryKey: ['leads', 'list'] });
    queryClient.setQueriesData<LeadsPage>({ queryKey: ['leads', 'list'] }, (old) =>
      old && Array.isArray(old.data)
        ? { ...old, data: old.data.map((l) => (l.id === id ? { ...l, status } : l)) }
        : old,
    );
    return snapshot;
  };
  const rollback = (snapshot?: Snapshot) => snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) => leadsApi.updateStatus(id, status),
    onMutate: ({ id, status }) => applyOptimisticStatus(id, status),
    onError: (_err, _vars, snapshot) => rollback(snapshot),
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
    onMutate: (id) => applyOptimisticStatus(id, 'converted'),
    onError: (_err, _id, snapshot) => rollback(snapshot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });

  const createMut = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Yangi murojaat qo'shildi");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<Lead> & { id: string }) => leadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Murojaat yangilandi");
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
    createLead: createMut.mutate,
    updateLead: updateMut.mutate,
    /** a create/update request is in flight (disable the save buttons) */
    isSavingLead: createMut.isPending || updateMut.isPending,
    statusCounts,
    deleteLead: deleteMut.mutate,
    isDeleting: deleteMut.isPending,
  };
};
