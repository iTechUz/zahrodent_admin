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
import { paymentsApi, doctorsApi, analyticsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';

import { clinicToday, clinicPeriodRange, getMonthToDateRange } from '@/shared/lib/date-utils';

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

  // lookups: every page (the backend caps limit at 100). Patients are NOT loaded here — rows embed `patient`
  // and the form's picker searches server-side.
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

  // the per-doctor breakdown follows the page's period filter (collected cash in that period)
  const doctorStatsPeriod = {
    ...(table.filters.startDate ? { startDate: table.filters.startDate } : {}),
    ...(table.filters.endDate ? { endDate: table.filters.endDate } : {}),
  };
  const hasDoctorStatsPeriod = Object.keys(doctorStatsPeriod).length > 0;
  const { data: doctorStatsData } = useQuery({
    queryKey: queryKeys.paymentsDoctorStatsPeriod(doctorStatsPeriod),
    queryFn: () => paymentsApi.doctorStats(hasDoctorStatsPeriod ? doctorStatsPeriod : undefined),
    enabled: authed,
  });

  type Period = 'all' | 'today' | 'week' | 'month';

  /** quick period select: the date inputs always follow it ("all" clears them) */
  const setPeriod = (period: Period) => {
    table.setFilters('dateRange', period);
    const range = period === 'all' ? undefined : clinicPeriodRange(period);
    table.setFilters('startDate', range?.startDate);
    table.setFilters('endDate', range?.endDate);
  };

  /** manual date edit: the quick period no longer applies, so the select shows "Barchasi" */
  const setDateFilter = (key: 'startDate' | 'endDate', value: string) => {
    table.setFilters(key, value || undefined);
    table.setFilters('dateRange', 'all');
  };

  const invalidateMoney = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    queryClient.invalidateQueries({ queryKey: queryKeys.paymentsStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.paymentsDoctorStats });
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    // patient balance / debt depends on payments
    queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
    queryClient.invalidateQueries({ queryKey: queryKeys.services });
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
      if (createMut.isPending || updateMut.isPending) return;
      if (dialog.editingItem) {
        updateMut.mutate(
          { id: dialog.editingItem.id, body: data as Partial<Payment> },
          { onSuccess: () => dialog.closeDialog() },
        );
      } else {
        createMut.mutate(data, { onSuccess: () => dialog.closeDialog() });
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
  const doctorRevenueTotal = hasDoctorStatsPeriod
    ? (doctorStatsData ?? []).reduce((s, ds) => s + (Number(ds.total) || 0), 0)
    : totalRevenue;
  const doctorRevenue = (doctorStatsData ?? [])
    .map((ds) => {
      const doctor = doctors.find((d) => d.id === ds.doctorId);
      return {
        doctorId: ds.doctorId,
        total: ds.total,
        name: doctor ? `${doctor.firstName} ${doctor.lastName}` : "Noma'lum",
        specialty: doctor?.specialty ?? '',
        percent: doctorRevenueTotal > 0 ? Math.round((ds.total / doctorRevenueTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    isSaving: createMut.isPending || updateMut.isPending,
    payments: table.data,
    totalCount: table.totalCount,
    totalPages: table.totalPages,
    page: table.page,
    setPage: table.setPage,
    doctors,
    doctorRevenue,
    /** denominator of the doctor % column (period total when a period is selected) */
    doctorRevenueTotal,
    hasDoctorStatsPeriod,
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
    setPeriod,
    setDateFilter,
    modalOpen: dialog.isOpen,
    setModalOpen: dialog.setIsOpen,
    editing: dialog.editingItem,
    deleteId,
    setDeleteId,
    openCreate: dialog.openCreate,
    openEdit: (p: Payment) => dialog.openEdit(p, FinanceService.mapToForm),
    handleSave,
    handleDelete,
    isLoading: table.isLoading,
    error: table.error,
    refetch: table.refetch,
    sort: table.sort,
    setSort: table.setSort,
  };
};
