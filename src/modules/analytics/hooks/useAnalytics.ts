import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { analyticsApi, servicesApi, doctorsApi } from '@/lib/api/endpoints';
import { fetchAllPages } from '@/lib/api/helpers';
import { queryKeys } from '@/lib/api/query-keys';
import { can, canAccessPayments } from '@/shared/config/roles';
import {
  monthlyConversionSeries,
  monthlyRevenueSeries,
  monthLabel,
  REPORT_CHART_COLORS,
  sourceChartData,
} from '@/shared/lib/reporting';

export const ANALYTICS_MONTHS = 6;
/** Period choices for the charts (backend caps `months` at 24). */
export const ANALYTICS_PERIOD_OPTIONS = [
  { value: 3, label: 'Oxirgi 3 oy' },
  { value: 6, label: 'Oxirgi 6 oy' },
  { value: 12, label: 'Oxirgi 12 oy' },
  { value: 24, label: 'Oxirgi 24 oy' },
] as const;

/** Analytics charts are built from backend aggregates (/analytics/monthly, /analytics/sources). */
export const useAnalytics = () => {
  const authed = useStore((s) => s.isAuthenticated);
  const role = useStore((s) => s.currentUser?.role);
  const canViewPayments = canAccessPayments(role);
  const [months, setMonths] = useState<number>(ANALYTICS_MONTHS);

  const monthlyQuery = useQuery({
    queryKey: queryKeys.analyticsMonthly(months),
    queryFn: () => analyticsApi.monthly({ months }),
    enabled: authed,
  });
  const monthly = useMemo(() => monthlyQuery.data ?? [], [monthlyQuery.data]);

  const sourcesQuery = useQuery({
    queryKey: queryKeys.analyticsSources,
    queryFn: () => analyticsApi.sources(),
    enabled: authed,
  });

  const { data: servicesRes } = useQuery({
    queryKey: queryKeys.servicesLookup(),
    queryFn: () => fetchAllPages(servicesApi.list),
    enabled: authed && canViewPayments,
  });
  const services = useMemo(() => servicesRes?.data ?? [], [servicesRes]);

  const { data: serviceStats } = useQuery({
    queryKey: queryKeys.servicesStats,
    queryFn: () => servicesApi.stats(),
    enabled: authed && canViewPayments && can(role, 'services.stats'),
  });

  const { data: efficiencyData } = useQuery({
    queryKey: queryKeys.doctorsEfficiency,
    queryFn: () => doctorsApi.efficiency(),
    enabled: authed && can(role, 'doctors.efficiency'),
  });

  const monthlyPatients = useMemo(
    () => monthly.map((r) => ({ month: monthLabel(r.month), count: r.newPatients })),
    [monthly],
  );
  // money is null for non-admins on the backend; never chart it client-side either
  const revenueGrowth = useMemo(
    () => monthlyRevenueSeries(canViewPayments ? monthly : monthly.map((r) => ({ ...r, revenue: null })), 'mln'),
    [monthly, canViewPayments],
  );
  const conversionData = useMemo(() => monthlyConversionSeries(monthly), [monthly]);
  const sourceData = useMemo(
    () => sourceChartData(sourcesQuery.data ?? []).map(({ name, value }) => ({ name, value })),
    [sourcesQuery.data],
  );

  const serviceIncomeData = useMemo(() => {
    return (
      serviceStats?.detailed?.map((s) => {
        const service = services.find((sv) => sv.id === s.serviceId);
        return {
          name: service?.name || "Noma'lum",
          revenue: s.revenue,
          patients: s.patients,
        };
      }) || []
    );
  }, [serviceStats, services]);

  const doctorEfficiency = useMemo(() => {
    if (!efficiencyData) return [];
    return efficiencyData.map((d) => ({
      name: `${d.firstName} ${d.lastName}`,
      totalBookings: d.totalBookings,
      totalVisits: d.totalVisits,
      conversionRate: d.conversionRate,
      avgCheck: d.avgCheck,
      totalRevenue: d.totalRevenue,
    }));
  }, [efficiencyData]);

  const colors = [...REPORT_CHART_COLORS];

  return {
    months,
    setMonths,
    monthlyPatients,
    revenueGrowth,
    conversionData,
    sourceData,
    colors,
    canViewPayments,
    serviceStats: serviceIncomeData,
    doctorEfficiency,
    isLoading: monthlyQuery.isLoading || sourcesQuery.isLoading,
    isError: monthlyQuery.isError,
    error: monthlyQuery.error,
    refetch: () => {
      monthlyQuery.refetch();
      sourcesQuery.refetch();
    },
  };
};
