import { useMemo, useState } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, UserPlus, Stethoscope, CreditCard } from 'lucide-react';
import { analyticsApi, bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can, canAccessPayments, roleAccess } from '@/shared/config/roles';
import { clinicToday } from '@/shared/lib/date-utils';
import { ALL_TIME_START, usePeriodAnalytics } from '@/shared/hooks/usePeriodAnalytics';
import { detectPreset, presetLabel, presetRange, type DateRange } from '@/shared/components/DateRangeFilter';
import {
  lastTwoMonths,
  monthlyPatientSeries,
  monthlyRevenueSeries,
  monthOverMonthHint,
  sourceChartData,
} from '@/shared/lib/reporting';
import type { Doctor, Patient } from '@/shared/types';

export const RECENT_BOOKINGS_LIMIT = 5;

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
  // this month vs last month hint needs the last two calendar months regardless of the period
  const trendQuery = useQuery({
    queryKey: queryKeys.analyticsMonthly(2),
    queryFn: () => analyticsApi.monthly({ months: 2 }),
    enabled: authed && isThisMonth,
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

  const patientIds = useMemo(
    () => [...new Set(recentBookings.map((b) => b.patientId).filter(Boolean))],
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
  const trendRows = useMemo(() => trendQuery.data ?? [], [trendQuery.data]);

  const patientGrowth = useMemo(() => monthlyPatientSeries(monthly), [monthly]);
  const revenueData = useMemo(() => monthlyRevenueSeries(monthly), [monthly]);
  const sourceData = useMemo(() => sourceChartData(series.sources), [series.sources]);

  const newMom = lastTwoMonths(trendRows, 'newPatients');
  const revMom = lastTwoMonths(trendRows, 'revenue');
  // month-over-month only makes sense for the current month
  const newPatientsTrend = isThisMonth ? monthOverMonthHint(newMom.current, newMom.previous) : null;
  const revenueTrend = canViewPayments && isThisMonth ? monthOverMonthHint(revMom.current, revMom.previous) : null;

  const quickActions = useMemo(() => {
    const routes = role ? roleAccess[role] : [];
    const all = [
      { label: 'Yangi qabul', icon: CalendarDays, path: '/bookings', color: 'bg-primary/10 text-primary', allowed: can(role, 'bookings.create') },
      { label: "Bemor qo'shish", icon: UserPlus, path: '/patients', color: 'bg-info/10 text-info', allowed: can(role, 'patients.create') },
      { label: "To'lov qayd etish", icon: CreditCard, path: '/finance', color: 'bg-success/10 text-success', allowed: can(role, 'payments.create') },
      { label: 'Shifokorlar', icon: Stethoscope, path: '/doctors', color: 'bg-warning/10 text-warning', allowed: true },
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
      trendQuery.refetch();
      recentQuery.refetch();
    },
  };
};
