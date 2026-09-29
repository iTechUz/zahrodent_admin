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

  it('keys the query by [...queryKey, params] so list invalidation by prefix works', async () => {
    const { result, queryClient } = setup({ initialFilters: { source: 'phone' } });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const keys = queryClient.getQueryCache().getAll().map((q) => q.queryKey);
    expect(keys).toEqual([['things', { page: 0, limit: 10, search: '', source: 'phone' }]]);
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

  it('setSearch updates search and resets to page 0', async () => {
    const { result, fetchFn } = setup();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setPage(3));
    act(() => result.current.setSearch('Ali'));
    expect(result.current.search).toBe('Ali');
    expect(result.current.page).toBe(0);
    await waitFor(() => expect(fetchFn).toHaveBeenLastCalledWith({ page: 0, limit: 10, search: 'Ali' }));
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
