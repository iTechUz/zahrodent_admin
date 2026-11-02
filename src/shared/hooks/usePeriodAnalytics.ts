import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/endpoints';
import { queryKeys } from '@/lib/api/query-keys';
import { clinicToday } from '@/shared/lib/date-utils';
import type { MonthlyAnalyticsRow } from '@/shared/types';

export interface AnalyticsPeriod {
  startDate?: string;
  endDate?: string;
}

/** Backend limit of /analytics/daily. */
export const MAX_DAILY_DAYS = 92;
/** "All time" = from this date (monthly charts then show the last 24 months). */
export const ALL_TIME_START = '2000-01-01';

function daysInclusive(start: string, end: string): number {
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Normalised period + which series granularity to use for it. */
export function resolvePeriod(range: AnalyticsPeriod, today: string = clinicToday()) {
  const open = !range.startDate && !range.endDate;
  const startDate = open ? ALL_TIME_START : range.startDate;
  const endDate = range.endDate ?? today;
  const daily = !!startDate && !open && daysInclusive(startDate, endDate) <= MAX_DAILY_DAYS;
  return {
    allTime: open,
    daily,
    // what we send: an explicit start/end (end defaults to today server-side)
    period: { startDate, endDate: range.endDate } as AnalyticsPeriod,
    /** inclusive end, for display/maths */
    end: endDate,
    start: startDate,
  };
}

/**
 * Chart series + source split for a period: per day when it spans ≤ 92 days,
 * per month otherwise. Daily rows are returned as `MonthlyAnalyticsRow` with the
 * date in `month`, so the reporting helpers (and `monthLabel` → "DD.MM") work for both.
 */
export function usePeriodAnalytics(range: AnalyticsPeriod, enabled = true) {
  const { daily, period, allTime } = useMemo(() => resolvePeriod(range), [range]);
  // all time: let the backend use its own start so the cache key stays stable
  const sourcePeriod = useMemo(() => (allTime ? {} : period), [allTime, period]);

  const seriesQuery = useQuery({
    queryKey: daily ? queryKeys.analyticsDaily(period) : queryKeys.analyticsMonthlyPeriod(period),
    queryFn: async (): Promise<MonthlyAnalyticsRow[]> => {
      if (daily) {
        const rows = await analyticsApi.daily(period);
        return rows.map(({ date, ...r }) => ({ month: date, ...r }));
      }
      return analyticsApi.monthly(period);
    },
    enabled,
    placeholderData: keepPreviousData,
  });

  const sourcesQuery = useQuery({
    queryKey: queryKeys.analyticsSourcesPeriod(sourcePeriod),
    queryFn: () => analyticsApi.sources(sourcePeriod),
    enabled,
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => seriesQuery.data ?? [], [seriesQuery.data]);
  return {
    rows,
    sources: sourcesQuery.data ?? [],
    granularity: daily ? ('day' as const) : ('month' as const),
    isLoading: seriesQuery.isLoading || sourcesQuery.isLoading,
    isError: seriesQuery.isError,
    error: seriesQuery.error,
    refetch: () => {
      seriesQuery.refetch();
      sourcesQuery.refetch();
    },
  };
}

