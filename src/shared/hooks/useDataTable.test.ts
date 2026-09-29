import { act, renderHook } from '@testing-library/react';
import { useDataTable } from './useDataTable';

type Item = { id: number; name: string; kind: string };
const items: Item[] = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `n${i}`, kind: i % 2 ? 'odd' : 'even' }));
const filterFn = (item: Item, search: string, filters: Record<string, string>) =>
  item.name.includes(search) && (!filters.kind || filters.kind === 'all' || item.kind === filters.kind);

describe('useDataTable', () => {
  it('paginates with default perPage 8', () => {
    const { result } = renderHook(() => useDataTable({ data: items }));
    expect(result.current.data.map((i) => i.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(result.current.totalCount).toBe(20);
    expect(result.current.totalPages).toBe(3);
    act(() => result.current.setPage(2));
    expect(result.current.data.map((i) => i.id)).toEqual([16, 17, 18, 19]);
  });

  it('without filterFn returns all rows', () => {
    const { result } = renderHook(() => useDataTable({ data: items, perPage: 100 }));
    expect(result.current.data).toHaveLength(20);
  });

  it('search filters and resets the page', () => {
    const { result } = renderHook(() => useDataTable({ data: items, filterFn, perPage: 5 }));
    act(() => result.current.setPage(3));
    act(() => result.current.setSearch('n1'));
    expect(result.current.page).toBe(0);
    expect(result.current.totalCount).toBe(11); // n1, n10..n19
    expect(result.current.totalPages).toBe(3);
  });

  it('filters merge by key and reset the page', () => {
    const { result } = renderHook(() =>
      useDataTable({ data: items, filterFn, initialFilters: { kind: 'all' }, perPage: 5 }),
    );
    act(() => result.current.setPage(1));
    act(() => result.current.setFilters('kind', 'odd'));
    expect(result.current.filters).toEqual({ kind: 'odd' });
    expect(result.current.page).toBe(0);
    expect(result.current.totalCount).toBe(10);
    expect(result.current.data.every((i) => i.kind === 'odd')).toBe(true);
  });
});
