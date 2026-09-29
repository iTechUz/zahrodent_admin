import { useState, useCallback, useMemo } from 'react';
import { useQuery, keepPreviousData, type QueryKey } from '@tanstack/react-query';
import type { SortOrder } from '@/lib/api/endpoints';

export interface SortState {
  sortBy?: string;
  order?: SortOrder;
}

export type ServerTableParams<F> = { page: number; limit: number; search: string } & SortState & F;

interface UseServerTableOptions<T, F> {
  /** entity prefix, e.g. queryKeys.patients — the list key becomes [...queryKey, 'list', params] */
  queryKey: QueryKey;
  fetchFn: (params: ServerTableParams<F>) => Promise<{ data: T[]; total: number }>;
  initialFilters?: F;
  initialSort?: SortState;
  perPage?: number;
  enabled?: boolean;
}

export const useServerTable = <T extends object, F extends object>({
  queryKey,
  fetchFn,
  initialFilters = {} as F,
  initialSort = {},
  perPage = 10,
  enabled = true,
}: UseServerTableOptions<T, F>) => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<F>(initialFilters);
  const [sort, setSortState] = useState<SortState>(initialSort);

  const queryParams = useMemo(() => {
    const params = { page, limit: perPage, search, ...filters } as ServerTableParams<F>;
    if (sort.sortBy) {
      params.sortBy = sort.sortBy;
      params.order = sort.order ?? 'asc';
    }
    return params;
  }, [page, perPage, search, filters, sort]);

  const { data, isLoading, isPlaceholderData, error, refetch } = useQuery({
    queryKey: [...queryKey, 'list', queryParams],
    queryFn: () => fetchFn(queryParams),
    placeholderData: keepPreviousData,
    enabled,
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(0);
  }, []);

  const handleFilterChange = useCallback(<K extends keyof F>(key: K, value: F[K] | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  /** Click-to-sort: new column → asc, same column → toggles asc/desc. Pass an explicit order to force it. */
  const handleSort = useCallback((sortBy: string | undefined, order?: SortOrder) => {
    setSortState((prev) => {
      if (!sortBy) return {};
      if (order) return { sortBy, order };
      if (prev.sortBy === sortBy) return { sortBy, order: prev.order === 'asc' ? 'desc' : 'asc' };
      return { sortBy, order: 'asc' };
    });
    setPage(0);
  }, []);

  const totalPages = Math.ceil((data?.total ?? 0) / perPage);

  return {
    data: data?.data ?? [],
    totalCount: data?.total ?? 0,
    search,
    setSearch: handleSearch,
    filters,
    setFilters: handleFilterChange,
    sort,
    setSort: handleSort,
    page,
    setPage,
    totalPages,
    perPage,
    isLoading: enabled && isLoading,
    isPlaceholderData,
    error,
    refetch,
  };
};
