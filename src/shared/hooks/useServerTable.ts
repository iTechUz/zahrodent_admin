import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  /** search → request delay (ms); the input value updates immediately */
  searchDebounceMs?: number;
}

export const SEARCH_DEBOUNCE_MS = 300;

export const useServerTable = <T extends object, F extends object>({
  queryKey,
  fetchFn,
  initialFilters = {} as F,
  initialSort = {},
  perPage = 10,
  enabled = true,
  searchDebounceMs = SEARCH_DEBOUNCE_MS,
}: UseServerTableOptions<T, F>) => {
  const [page, setPage] = useState(0);
  /** what the user typed (bound to the input) */
  const [searchInput, setSearchInput] = useState('');
  /** what is sent to the backend — `searchInput` after it settled for `searchDebounceMs` */
  const [search, setAppliedSearch] = useState('');
  const appliedRef = useRef('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(debounceRef.current), []);
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

  /** Debounced: typing fires one request after a pause, and page resets to 0 together with it. */
  const handleSearch = useCallback(
    (val: string) => {
      setSearchInput(val);
      clearTimeout(debounceRef.current);
      const apply = () => {
        const next = val.trim();
        if (next === appliedRef.current) return; // e.g. only whitespace changed
        appliedRef.current = next;
        setAppliedSearch(next); // batched with the page reset → a single request
        setPage(0);
      };
      if (searchDebounceMs <= 0) apply();
      else debounceRef.current = setTimeout(apply, searchDebounceMs);
    },
    [searchDebounceMs],
  );

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
    /** input value (immediate) */
    search: searchInput,
    /** value actually sent to the backend (debounced, trimmed) */
    appliedSearch: search,
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
