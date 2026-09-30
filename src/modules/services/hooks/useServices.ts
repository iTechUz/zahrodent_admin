import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Service } from '@/shared/types';
import { toast } from 'sonner';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { ServiceModuleService } from '../services/service.service';
import { ServiceSchema } from '@/shared/lib/validation';
import { z } from 'zod';
import { servicesApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { can } from '@/shared/config/roles';

type ServiceFormValues = z.infer<typeof ServiceSchema>;

export const CATEGORIES = ['Davolash', 'Ortodontiya', 'Xirurgiya', 'Gigiyena'];

export const useServices = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const table = useServerTable<Service, { category?: string }>({
    queryKey: queryKeys.services,
    fetchFn: (params) => servicesApi.list(params),
    initialFilters: { category: 'all' },
    perPage: 20,
  });

  // GET /services/stats: admin + receptionist (doctors would get 403)
  const { data: stats } = useQuery({
    queryKey: queryKeys.servicesStats,
    queryFn: () => servicesApi.stats(),
    enabled: authed && can(role, 'services.stats'),
  });

  const createMut = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
      toast.success("Yangi xizmat qo'shildi");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Service> }) =>
      servicesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
      toast.success('Xizmat yangilandi');
    },
  });

  const deleteMut = useMutation({
    mutationFn: servicesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services });
      toast.success("Xizmat o'chirildi");
    },
  });

  const dialog = useDialogState<Service>(ServiceModuleService.initialState());

  const categories = useMemo(() => {
    // Ideally fetch these from a dedicated categories API
    return CATEGORIES;
  }, []);

  const groupedServices = useMemo(() => {
    return table.data.reduce(
      (acc, service) => {
        if (!acc[service.category]) acc[service.category] = [];
        acc[service.category].push(service);
        return acc;
      },
      {} as Record<string, Service[]>,
    );
  }, [table.data]);

  const handleSave = useCallback(
    (data: ServiceFormValues) => {
      if (dialog.editingItem) {
        updateMut.mutate(
          { id: dialog.editingItem.id, body: data as Partial<Service> },
          { onSettled: () => dialog.closeDialog() },
        );
      } else {
        createMut.mutate(data as Omit<Service, 'id'>, { onSettled: () => dialog.closeDialog() });
      }
    },
    [dialog, createMut, updateMut],
  );

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMut.mutate(deleteId, { onSettled: () => setDeleteId(null) });
    }
  }, [deleteId, deleteMut]);

  return {
    services: table.data,
    totalCount: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    groupedServices,
    categories,
    search: table.search,
    setSearch: table.setSearch,
    filters: table.filters,
    setFilters: table.setFilters,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    deleteId,
    setDeleteId,
    openCreate: dialog.openCreate,
    openEdit: (s: Service) => dialog.openEdit(s, ServiceModuleService.mapToForm),
    handleSave,
    handleDelete,
    isLoading: table.isLoading,
    error: table.error,
    refetch: table.refetch,
    sort: table.sort,
    setSort: table.setSort,
    stats,
  };
};
