import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Patient } from '@/shared/types';
import { toast } from 'sonner';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { PatientService } from '../services/patient.service';
import { PatientSchema } from '@/shared/lib/validation';
import { z } from 'zod';
import { patientsApi, type PatientUpdatePayload } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';

import { getMonthToDateRange } from '@/shared/lib/date-utils';

type PatientFormValues = z.infer<typeof PatientSchema>;

export const usePatients = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mtd = getMonthToDateRange();

  const table = useServerTable<
    Patient,
    { source?: string; startDate?: string; endDate?: string; debtOnly?: string }
  >({
    queryKey: queryKeys.patients,
    fetchFn: (params) => patientsApi.list(params),
    initialFilters: { 
      startDate: mtd.startDate, 
      endDate: mtd.endDate,
      source: 'all'
    },
    perPage: 10,
  });

  const { data: stats } = useQuery({
    queryKey: queryKeys.patientsStats,
    queryFn: () => patientsApi.stats(),
    enabled: authed,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
  };

  const createMut = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () => {
      invalidate();
      toast.success("Yangi bemor qo'shildi");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatientUpdatePayload }) =>
      patientsApi.update(id, body),
    onSuccess: (_, v) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.patient(v.id) });
      toast.success("Bemor ma'lumotlari yangilandi");
    },
  });

  const deleteMut = useMutation({
    mutationFn: patientsApi.remove,
    onSuccess: () => {
      invalidate();
      toast.success("Bemor o'chirildi");
    },
  });

  const dialog = useDialogState<Patient>(PatientService.initialState());


  const handleSave = useCallback(
    (data: PatientFormValues) => {
      const { assignedDoctorId, ...rest } = data;
      if (dialog.editingItem) {
        // "" from the select = no doctor → null unassigns on the backend
        updateMut.mutate(
          { id: dialog.editingItem.id, body: { ...rest, assignedDoctorId: assignedDoctorId || null } },
          { onSettled: () => dialog.closeDialog() },
        );
      } else {
        createMut.mutate(
          {
            ...rest,
            notes: rest.notes ?? '',
            ...(assignedDoctorId ? { assignedDoctorId } : {}),
          } as Parameters<typeof patientsApi.create>[0],
          { onSettled: () => dialog.closeDialog() },
        );
      }
    },
    [dialog, createMut, updateMut],
  );

  /** "Qarzdorlar": debtors of any registration date — the month-to-date range would hide older debtors */
  const toggleDebtOnly = useCallback(() => {
    if (table.filters.debtOnly === 'true') {
      table.setFilters('debtOnly', undefined);
    } else {
      table.setFilters('debtOnly', 'true');
      table.setFilters('startDate', undefined);
      table.setFilters('endDate', undefined);
    }
  }, [table]);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMut.mutate(deleteId, { onSettled: () => setDeleteId(null) });
    }
  }, [deleteId, deleteMut]);

  return {
    patients: table.data,
    totalPatients: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    search: table.search,
    setSearch: table.setSearch,
    filters: table.filters,
    setFilters: table.setFilters,
    toggleDebtOnly,
    sort: table.sort,
    setSort: table.setSort,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    openCreate: dialog.openCreate,
    openEdit: (p: Patient) => dialog.openEdit(p, PatientService.mapToForm),
    handleSave,
    deleteId,
    setDeleteId,
    handleDelete,
    isLoading: table.isLoading,
    error: table.error,
    refetch: table.refetch,
    isSaving: createMut.isPending || updateMut.isPending,
    stats,
  };
};
