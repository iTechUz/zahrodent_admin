import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, UserPlus, Stethoscope, CreditCard } from 'lucide-react';
import { analyticsApi, bookingsApi, doctorsApi, patientsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can, canAccessPayments, roleAccess } from '@/shared/config/roles';
import { clinicToday } from '@/shared/lib/date-utils';
import {
  lastTwoMonths,
  monthlyPatientSeries,
  monthlyRevenueSeries,
  monthOverMonthHint,
  sourceChartData,
} from '@/shared/lib/reporting';
import type { Doctor, Patient } from '@/shared/types';

export const DASHBOARD_MONTHS = 6;
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

  const dashboardQuery = useQuery({
    queryKey: queryKeys.analyticsDashboard(today),
    queryFn: () => analyticsApi.dashboard({ date: today }),
    enabled: authed,
  });

  const monthlyQuery = useQuery({
    queryKey: queryKeys.analyticsMonthly(DASHBOARD_MONTHS),
    queryFn: () => analyticsApi.monthly({ months: DASHBOARD_MONTHS }),
    enabled: authed,
  });

  const sourcesQuery = useQuery({
    queryKey: queryKeys.analyticsSources,
    queryFn: () => analyticsApi.sources(),
    enabled: authed,
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
  const monthly = useMemo(() => monthlyQuery.data ?? [], [monthlyQuery.data]);

  const patientGrowth = useMemo(() => monthlyPatientSeries(monthly), [monthly]);
  const revenueData = useMemo(() => monthlyRevenueSeries(monthly), [monthly]);
  const sourceData = useMemo(() => sourceChartData(sourcesQuery.data ?? []), [sourcesQuery.data]);

  const newMom = lastTwoMonths(monthly, 'newPatients');
  const revMom = lastTwoMonths(monthly, 'revenue');
  const newPatientsTrend = monthOverMonthHint(newMom.current, newMom.previous);
  const revenueTrend = canViewPayments ? monthOverMonthHint(revMom.current, revMom.previous) : null;

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

  const isLoading = dashboardQuery.isLoading || monthlyQuery.isLoading || sourcesQuery.isLoading;

  return {
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
      monthlyQuery.refetch();
      sourcesQuery.refetch();
      recentQuery.refetch();
    },
  };
};
