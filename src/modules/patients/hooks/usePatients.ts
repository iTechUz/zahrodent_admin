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
import { patientsApi, doctorsApi, type PatientUpdatePayload } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { ApiError } from '@/lib/api/client';
import { reportMutationError } from '@/lib/api/query-client';
import { formatUzS } from '@/shared/lib/formatters';


type PatientFormValues = z.infer<typeof PatientSchema>;

export const usePatients = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const table = useServerTable<
    Patient,
    { source?: string; startDate?: string; endDate?: string; debtOnly?: string; doctorId?: string }
  >({
    queryKey: queryKeys.patients,
    fetchFn: (params) => patientsApi.list(params),
    // No default date range: it is by registration date and hid every older patient
    initialFilters: { source: 'all' },
    perPage: 10,
  });

  // doctor filter options (GET /doctors is open to every staff role)
  const { data: doctorsData } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed,
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

  const restoreMut = useMutation({
    mutationFn: patientsApi.restore,
    onSuccess: () => {
      invalidate();
      toast.success('Bemor arxivdan tiklandi');
    },
  });

  // soft delete: the patient is archived, visits/payments/bookings history stays
  const [debtConfirm, setDebtConfirm] = useState<{ id: string; message: string } | null>(null);
  const deleteMut = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      force ? patientsApi.remove(id, { force: true }) : patientsApi.remove(id),
    onSuccess: (_, { id }) => {
      invalidate();
      setDebtConfirm(null);
      toast.success('Bemor arxivlandi', {
        description: "Tarix (tashriflar, to'lovlar, qabullar) saqlanib qoldi",
        action: { label: 'Qaytarish', onClick: () => restoreMut.mutate(id) },
      });
    },
    onError: (err, { id, force }) => {
      // 409 = the patient still owes money → ask, then retry with ?force=true
      if (!force && err instanceof ApiError && err.status === 409) {
        const row = table.data.find((p) => p.id === id);
        const debt = typeof row?.balance === 'number' && row.balance < 0 ? -row.balance : 0;
        setDebtConfirm({
          id,
          message: debt > 0 ? `Bemorning qarzi ${formatUzS(debt)}.` : err.message,
        });
        return;
      }
      reportMutationError(err);
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
          { onSuccess: () => dialog.closeDialog() },
        );
      } else {
        createMut.mutate(
          {
            ...rest,
            notes: rest.notes ?? '',
            ...(assignedDoctorId ? { assignedDoctorId } : {}),
          } as Parameters<typeof patientsApi.create>[0],
          { onSuccess: () => dialog.closeDialog() },
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
      deleteMut.mutate({ id: deleteId }, { onSettled: () => setDeleteId(null) });
    }
  }, [deleteId, deleteMut]);

  /** "Baribir arxivlaysizmi?" confirmed → the same DELETE with ?force=true */
  const confirmArchiveWithDebt = useCallback(() => {
    if (debtConfirm && !deleteMut.isPending) deleteMut.mutate({ id: debtConfirm.id, force: true });
  }, [debtConfirm, deleteMut]);

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
    doctors: doctorsData?.data ?? [],
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
    debtConfirm,
    cancelArchiveWithDebt: () => setDebtConfirm(null),
    confirmArchiveWithDebt,
    isArchiving: deleteMut.isPending,
    isLoading: table.isLoading,
    error: table.error,
    refetch: table.refetch,
    isSaving: createMut.isPending || updateMut.isPending,
    stats,
  };
};
