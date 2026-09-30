import { act, renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/utils';
import { useServerTable } from './useServerTable';

type Row = { id: number };
type Filters = { status?: string; source?: string };

function setup(opts: { perPage?: number; initialFilters?: Filters; total?: number } = {}) {
  const fetchFn = vi.fn(async (params: { page: number; limit: number; search: string } & Filters) => ({
    data: [{ id: params.page }],
    total: opts.total ?? 45,
  }));
  const { wrapper, queryClient } = createWrapper();
  const hook = renderHook(
    () =>
      useServerTable<Row, Filters>({
        queryKey: ['things'],
        fetchFn,
        initialFilters: opts.initialFilters,
        perPage: opts.perPage,
      }),
    { wrapper },
  );
  return { ...hook, fetchFn, queryClient };
}

describe('useServerTable', () => {
  it('fetches page 0 with default limit 10, empty search and initial filters', async () => {
    const { result, fetchFn } = setup({ initialFilters: { status: 'all' } });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchFn).toHaveBeenCalledWith({ page: 0, limit: 10, search: '', status: 'all' });
    expect(result.current.data).toEqual([{ id: 0 }]);
    expect(result.current.totalCount).toBe(45);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.perPage).toBe(10);
  });

  it('uses a custom perPage for limit and totalPages', async () => {
    const { result, fetchFn } = setup({ perPage: 20, total: 41 });
    await waitFor(() => expect(result.current.totalCount).toBe(41));
    expect(fetchFn).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
    expect(result.current.totalPages).toBe(3);
  });

  it("keys the query by [...queryKey, 'list', params] so list invalidation by prefix works", async () => {
    const { result, queryClient } = setup({ initialFilters: { source: 'phone' } });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const keys = queryClient.getQueryCache().getAll().map((q) => q.queryKey);
    expect(keys).toEqual([['things', 'list', { page: 0, limit: 10, search: '', source: 'phone' }]]);
  });

  it('setSort sends sortBy + order, toggles on the same column and resets to page 0', async () => {
    const { result, fetchFn } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setPage(2));
    act(() => result.current.setSort('createdAt'));
    expect(result.current.sort).toEqual({ sortBy: 'createdAt', order: 'asc' });
    expect(result.current.page).toBe(0);
    await waitFor(() =>
      expect(fetchFn).toHaveBeenLastCalledWith({ page: 0, limit: 10, search: '', sortBy: 'createdAt', order: 'asc' }),
    );
    act(() => result.current.setSort('createdAt'));
    expect(result.current.sort).toEqual({ sortBy: 'createdAt', order: 'desc' });
    act(() => result.current.setSort('firstName'));
    expect(result.current.sort).toEqual({ sortBy: 'firstName', order: 'asc' });
    act(() => result.current.setSort('firstName', 'desc'));
    expect(result.current.sort).toEqual({ sortBy: 'firstName', order: 'desc' });
    act(() => result.current.setSort(undefined));
    expect(result.current.sort).toEqual({});
    await waitFor(() => expect(fetchFn).toHaveBeenLastCalledWith({ page: 0, limit: 10, search: '' }));
  });

  it('initialSort is applied to the first request', async () => {
    const fetchFn = vi.fn(async () => ({ data: [], total: 0 }));
    const { wrapper } = createWrapper();
    renderHook(
      () => useServerTable<Row, Filters>({ queryKey: ['s'], fetchFn, initialSort: { sortBy: 'date', order: 'desc' } }),
      { wrapper },
    );
    await waitFor(() =>
      expect(fetchFn).toHaveBeenCalledWith({ page: 0, limit: 10, search: '', sortBy: 'date', order: 'desc' }),
    );
  });

  it('enabled=false does not fetch and is not loading', async () => {
    const fetchFn = vi.fn(async () => ({ data: [], total: 0 }));
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useServerTable<Row, Filters>({ queryKey: ['off'], fetchFn, enabled: false }),
      { wrapper },
    );
    await Promise.resolve();
    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('setPage refetches with the new page and keeps previous data while loading', async () => {
    const { result, fetchFn } = setup();
    await waitFor(() => expect(result.current.data).toEqual([{ id: 0 }]));
    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(result.current.data).toEqual([{ id: 0 }]);
    expect(result.current.isPlaceholderData).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([{ id: 2 }]));
    expect(fetchFn).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  describe('debounced search', () => {
    afterEach(() => vi.useRealTimers());

    it('updates the input value immediately but requests only after 300ms, then resets to page 0', async () => {
      const { result, fetchFn } = setup();
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      act(() => result.current.setPage(3));
      await waitFor(() => expect(fetchFn).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 })));
      vi.useFakeTimers();
      const callsBefore = fetchFn.mock.calls.length;

      act(() => result.current.setSearch('A'));
      act(() => result.current.setSearch('Al'));
      act(() => result.current.setSearch('Ali'));
      expect(result.current.search).toBe('Ali');
      expect(result.current.appliedSearch).toBe('');
      expect(result.current.page).toBe(3); // not yet
      act(() => vi.advanceTimersByTime(299));
      expect(result.current.appliedSearch).toBe('');

      act(() => vi.advanceTimersByTime(1));
      expect(result.current.appliedSearch).toBe('Ali');
      expect(result.current.page).toBe(0);
      vi.useRealTimers();
      await waitFor(() => expect(fetchFn).toHaveBeenLastCalledWith({ page: 0, limit: 10, search: 'Ali' }));
      // one request for the three keystrokes
      expect(fetchFn.mock.calls.slice(callsBefore).filter(([p]) => p.search === 'Ali')).toHaveLength(1);
      expect(fetchFn.mock.calls.slice(callsBefore).some(([p]) => p.search === 'A' || p.search === 'Al')).toBe(false);
    });

    it('trims the value and ignores whitespace-only changes', () => {
      vi.useFakeTimers();
      const { result } = setup();
      act(() => result.current.setPage(2));
      act(() => result.current.setSearch('   '));
      act(() => vi.advanceTimersByTime(300));
      expect(result.current.appliedSearch).toBe('');
      expect(result.current.page).toBe(2); // nothing changed → no reset
      act(() => result.current.setSearch(' Ali '));
      act(() => vi.advanceTimersByTime(300));
      expect(result.current.appliedSearch).toBe('Ali');
    });

    it('searchDebounceMs: 0 applies immediately', () => {
      const fetchFn = vi.fn(async () => ({ data: [], total: 0 }));
      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useServerTable<Row, Filters>({ queryKey: ['now'], fetchFn, searchDebounceMs: 0 }),
        { wrapper },
      );
      act(() => result.current.setSearch('x'));
      expect(result.current.appliedSearch).toBe('x');
    });

    it('does not fire after unmount', () => {
      vi.useFakeTimers();
      const { result, unmount, fetchFn } = setup();
      act(() => result.current.setSearch('late'));
      unmount();
      act(() => vi.advanceTimersByTime(1000));
      expect(fetchFn).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'late' }));
    });
  });

  it('setFilters(key, value) merges one filter and resets to page 0', async () => {
    const { result, fetchFn } = setup({ initialFilters: { status: 'all', source: 'all' } });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setPage(1));
    act(() => result.current.setFilters('status', 'paid'));
    expect(result.current.filters).toEqual({ status: 'paid', source: 'all' });
    expect(result.current.page).toBe(0);
    await waitFor(() =>
      expect(fetchFn).toHaveBeenLastCalledWith({ page: 0, limit: 10, search: '', status: 'paid', source: 'all' }),
    );
  });

  it('setFilters(key, undefined) clears a filter value (dropped by qs)', async () => {
    const { result } = setup({ initialFilters: { status: 'paid' } });
    act(() => result.current.setFilters('status', undefined));
    expect(result.current.filters).toEqual({ status: undefined });
  });

  it('exposes fetch errors', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('boom'));
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServerTable<Row, Filters>({ queryKey: ['err'], fetchFn }), { wrapper });
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.data).toEqual([]);
    expect(result.current.totalPages).toBe(0);
  });
});
