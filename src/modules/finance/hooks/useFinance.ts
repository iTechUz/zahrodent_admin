import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { Payment } from '@/shared/types';
import { toast } from 'sonner';
import { useDialogState } from '@/shared/hooks/useDialogState';
import { useServerTable } from '@/shared/hooks/useServerTable';
import { FinanceService } from '../services/finance.service';
import { PaymentSchema } from '@/shared/lib/validation';
import { z } from 'zod';
import { paymentsApi, patientsApi, doctorsApi, analyticsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';

import { clinicToday, getMonthToDateRange } from '@/shared/lib/date-utils';

type PaymentFormValues = z.infer<typeof PaymentSchema>;

export const useFinance = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const mtd = getMonthToDateRange();

  const table = useServerTable<
    Payment,
    { status?: string; method?: string; dateRange?: string; type?: string; startDate?: string; endDate?: string }
  >({
    queryKey: queryKeys.payments,
    fetchFn: (params) => paymentsApi.list(params),
    initialFilters: { 
      status: 'all', 
      method: 'all', 
      dateRange: 'month', 
      type: 'all',
      startDate: mtd.startDate,
      endDate: mtd.endDate
    },
    perPage: 10,
  });

  // lookups: every page (the backend caps limit at 100)
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: queryKeys.patientsLookup(),
    queryFn: () => fetchAllPages(patientsApi.list),
    enabled: authed,
  });
  const patients = patientsData?.data ?? [];

  const { data: doctorsData } = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed,
  });
  const doctors = doctorsData?.data ?? [];

  const { data: stats } = useQuery({
    queryKey: queryKeys.paymentsStats,
    queryFn: () => paymentsApi.stats(),
    enabled: authed,
  });

  // month revenue + unpaid count are not in /payments/stats — use the dashboard aggregate
  const today = clinicToday();
  const { data: summary } = useQuery({
    queryKey: queryKeys.analyticsDashboard(today),
    queryFn: () => analyticsApi.dashboard({ date: today }),
    enabled: authed,
  });

  const { data: doctorStatsData } = useQuery({
    queryKey: queryKeys.paymentsDoctorStats,
    queryFn: () => paymentsApi.doctorStats(),
    enabled: authed,
  });

  const invalidateMoney = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    queryClient.invalidateQueries({ queryKey: queryKeys.paymentsStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.paymentsDoctorStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    // patient balance / debt depends on payments
    queryClient.invalidateQueries({ queryKey: queryKeys.patients });
  };

  const createMut = useMutation({
    mutationFn: (body: PaymentFormValues) => paymentsApi.create(body as Omit<Payment, 'id'>),
    onSuccess: () => {
      invalidateMoney();
      toast.success("To'lov qayd etildi");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Payment> }) =>
      paymentsApi.update(id, body),
    onSuccess: () => {
      invalidateMoney();
      toast.success("To'lov yangilandi");
    },
  });

  const deleteMut = useMutation({
    mutationFn: paymentsApi.remove,
    onSuccess: () => {
      invalidateMoney();
      toast.success("To'lov o'chirildi");
    },
  });

  const dialog = useDialogState<Payment>(FinanceService.initialState());

  const handleSave = useCallback(
    (data: PaymentFormValues) => {
      if (dialog.editingItem) {
        updateMut.mutate(
          { id: dialog.editingItem.id, body: data as Partial<Payment> },
          { onSettled: () => dialog.closeDialog() },
        );
      } else {
        createMut.mutate(data, { onSettled: () => dialog.closeDialog() });
      }
    },
    [dialog, createMut, updateMut],
  );

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteMut.mutate(deleteId, { onSettled: () => setDeleteId(null) });
    }
  }, [deleteId, deleteMut]);

  // Map doctorStats to include doctor name and specialty
  const totalRevenue = stats?.totalRevenue ?? 0;
  const doctorRevenue = (doctorStatsData ?? [])
    .map((ds) => {
      const doctor = doctors.find((d) => d.id === ds.doctorId);
      return {
        doctorId: ds.doctorId,
        total: ds.total,
        name: doctor ? `${doctor.firstName} ${doctor.lastName}` : "Noma'lum",
        specialty: doctor?.specialty ?? '',
        percent: totalRevenue > 0 ? Math.round((ds.total / totalRevenue) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    payments: table.data,
    totalCount: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    patients,
    doctors,
    doctorRevenue,
    totalRevenue,
    /** paid revenue in the current clinic month (backend aggregate) */
    thisMonth: summary?.monthRevenue ?? 0,
    todayRevenue: stats?.todayRevenue ?? summary?.todayRevenue ?? 0,
    totalDebt: stats?.pendingAmount ?? 0,
    /** number of unpaid/partial payments (backend aggregate) */
    unpaidCount: summary?.unpaidCount ?? 0,
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
    openEdit: (p: Payment) => dialog.openEdit(p, FinanceService.mapToForm),
    handleSave,
    handleDelete,
    isLoading: table.isLoading || patientsLoading,
    error: table.error,
    refetch: table.refetch,
    sort: table.sort,
    setSort: table.setSort,
  };
};
