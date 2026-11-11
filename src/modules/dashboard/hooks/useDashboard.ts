import { useMemo, useState } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, UserPlus, Stethoscope, CreditCard } from 'lucide-react';
import { analyticsApi, bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can, canAccessPayments, roleAccess } from '@/shared/config/roles';
import { addMonthsToDate, clinicMonthStart, clinicToday } from '@/shared/lib/date-utils';
import { ALL_TIME_START, usePeriodAnalytics } from '@/shared/hooks/usePeriodAnalytics';
import { detectPreset, presetLabel, presetRange, type DateRange } from '@/shared/components/DateRangeFilter';
import {
  monthlyPatientSeries,
  monthlyRevenueSeries,
  monthOverMonthHint,
  sourceChartData,
} from '@/shared/lib/reporting';
import type { DailyAnalyticsRow, Doctor, Patient } from '@/shared/types';

export const RECENT_BOOKINGS_LIMIT = 5;
/** The month-over-month hint compares the same day-of-month range; in the first days it is too noisy → hidden. */
export const MOM_MIN_DAY = 6;

/**
 * Dashboard figures come from the backend aggregates (/analytics/*) — nothing is
 * computed from a truncated client-side list any more.
 */
export const useDashboard = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const canViewPayments = canAccessPayments(role);
  const navigate = useNavigate();
  const today = clinicToday();

  // period for the "month" figures and charts; default = this month
  const [range, setRange] = useState<DateRange>(() => presetRange('month'));
  const isThisMonth = detectPreset(range) === 'month';
  // the backend treats "no dates" as this month, so "all time" is an explicit early start
  const period = useMemo(
    () => (range.startDate || range.endDate ? range : { startDate: ALL_TIME_START }),
    [range],
  );

  const dashboardQuery = useQuery({
    queryKey: queryKeys.analyticsDashboard(today, period),
    queryFn: () => analyticsApi.dashboard({ date: today, ...period }),
    enabled: authed,
    placeholderData: keepPreviousData,
  });

  // charts + source split follow the selected period (per day ≤ 92 days, else per month)
  const series = usePeriodAnalytics(range, authed);
  // this month vs last month hint: month-to-date vs the SAME day-of-month range of the previous month
  // (a partial month against a full one would always look like a drop)
  const momEnabled = isThisMonth && Number(today.slice(8, 10)) >= MOM_MIN_DAY;
  const monthStart = clinicMonthStart();
  const currentMtd = useMemo(() => ({ startDate: monthStart, endDate: today }), [monthStart, today]);
  const previousMtd = useMemo(
    () => ({ startDate: addMonthsToDate(monthStart, -1), endDate: addMonthsToDate(today, -1) }),
    [monthStart, today],
  );
  const currentMtdQuery = useQuery({
    queryKey: queryKeys.analyticsDaily(currentMtd),
    queryFn: () => analyticsApi.daily(currentMtd),
    enabled: authed && momEnabled,
  });
  const previousMtdQuery = useQuery({
    queryKey: queryKeys.analyticsDaily(previousMtd),
    queryFn: () => analyticsApi.daily(previousMtd),
    enabled: authed && momEnabled,
  });

  const recentParams = { limit: RECENT_BOOKINGS_LIMIT };
  const recentQuery = useQuery({
    queryKey: queryKeys.bookingsList(recentParams),
    queryFn: () => bookingsApi.list(recentParams),
    enabled: authed,
  });
  const recentBookings = recentQuery.data?.data ?? [];

  // names for the recent-bookings list: doctors lookup (small) + the few patients by id
  const doctorsQuery = useQuery({
    queryKey: queryKeys.doctorsLookup(),
    queryFn: () => fetchAllPages(doctorsApi.list),
    enabled: authed && recentBookings.length > 0,
  });

  // booking rows embed `patient` — only fall back to a per-id request for rows without it
  const patientIds = useMemo(
    () => [...new Set(recentBookings.filter((b) => !b.patient).map((b) => b.patientId).filter(Boolean))],
    [recentBookings],
  );
  const patientsById = useQueries({
    queries: patientIds.map((id) => ({
      queryKey: queryKeys.patient(id),
      queryFn: () => patientsApi.get(id),
      enabled: authed,
      meta: { silentError: true },
    })),
    combine: (results) => {
      const map = new Map<string, Patient>();
      results.forEach((q) => q.data && map.set(q.data.id, q.data));
      return map;
    },
  });

  const doctorsById = useMemo(() => {
    const map = new Map<string, Doctor>();
    (doctorsQuery.data?.data ?? []).forEach((d) => map.set(d.id, d));
    return map;
  }, [doctorsQuery.data]);

  const stats = dashboardQuery.data;
  const monthly = series.rows;

  const patientGrowth = useMemo(() => monthlyPatientSeries(monthly), [monthly]);
  const revenueData = useMemo(() => monthlyRevenueSeries(monthly), [monthly]);
  const sourceData = useMemo(() => sourceChartData(series.sources), [series.sources]);

  const sum = (rows: DailyAnalyticsRow[] | undefined, field: 'newPatients' | 'revenue') =>
    (rows ?? []).reduce((s, r) => s + Number(r[field] ?? 0), 0);
  // month-over-month only makes sense for the current month, once enough days have passed, and once both ranges loaded
  const momReady = momEnabled && !!currentMtdQuery.data && !!previousMtdQuery.data;
  const newPatientsTrend = momReady
    ? monthOverMonthHint(sum(currentMtdQuery.data, 'newPatients'), sum(previousMtdQuery.data, 'newPatients'))
    : null;
  const revenueTrend =
    momReady && canViewPayments
      ? monthOverMonthHint(sum(currentMtdQuery.data, 'revenue'), sum(previousMtdQuery.data, 'revenue'))
      : null;

  const quickActions = useMemo(() => {
    const routes = role ? roleAccess[role] : [];
    const all = [
      { label: 'Yangi qabul', icon: CalendarDays, path: '/bookings', to: '/bookings?new=1', color: 'bg-primary/10 text-primary', allowed: can(role, 'bookings.create') },
      { label: "Bemor qo'shish", icon: UserPlus, path: '/patients', to: '/patients?new=1', color: 'bg-info/10 text-info', allowed: can(role, 'patients.create') },
      { label: "To'lov qayd etish", icon: CreditCard, path: '/finance', to: '/finance', color: 'bg-success/10 text-success', allowed: can(role, 'payments.create') },
      { label: 'Shifokorlar', icon: Stethoscope, path: '/doctors', to: '/doctors', color: 'bg-warning/10 text-warning', allowed: true },
    ];
    return all
      .filter((a) => a.allowed && routes.includes(a.path))
      .map(({ allowed: _allowed, ...a }) => a);
  }, [role]);

  const isLoading = dashboardQuery.isLoading || series.isLoading;

  return {
    range,
    setRange,
    periodLabel: presetLabel(range),
    granularity: series.granularity,
    // headline figures (backend aggregates)
    totalPatients: stats?.totalPatients ?? 0,
    newPatients: stats?.newPatientsThisMonth ?? 0,
    todayBookings: stats?.todayBookings ?? 0,
    completedToday: stats?.todayCompleted ?? 0,
    pendingBookings: stats?.pendingBookings ?? 0,
    activeDoctors: stats?.activeDoctors ?? 0,
    totalDoctors: stats?.totalDoctors ?? 0,
    todayRevenue: stats?.todayRevenue ?? 0,
    monthRevenue: stats?.monthRevenue ?? 0,
    monthExpenses: stats?.monthExpenses ?? 0,
    totalDebt: stats?.unpaidTotal ?? 0,
    unpaidCount: stats?.unpaidCount ?? 0,
    // lists
    recentBookings,
    patientsById,
    doctorsById,
    // charts
    patientGrowth,
    revenueData,
    sourceData,
    newPatientsTrend,
    revenueTrend,
    quickActions,
    navigate,
    canViewPayments,
    isLoading,
    /** the headline request failed — show an error state instead of zeros */
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    refetch: () => {
      dashboardQuery.refetch();
      series.refetch();
      currentMtdQuery.refetch();
      previousMtdQuery.refetch();
      recentQuery.refetch();
    },
  };
};
