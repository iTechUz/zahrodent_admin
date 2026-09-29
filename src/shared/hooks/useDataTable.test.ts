import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDataTable } from './useDataTable';

type Row = { id: number; name: string; kind: string };
const rows: Row[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  kind: i % 2 === 0 ? 'odd' : 'even',
}));

const filterFn = (r: Row, search: string, filters: Record<string, string>) =>
  (!search || r.name.toLowerCase().includes(search.toLowerCase())) &&
  (!filters.kind || filters.kind === 'all' || r.kind === filters.kind);

describe('useDataTable', () => {
  it('defaults: page 0, perPage 8, empty search/filters, no filterFn returns all', () => {
    const { result } = renderHook(() => useDataTable({ data: rows }));
    expect(result.current.page).toBe(0);
    expect(result.current.perPage).toBe(8);
    expect(result.current.search).toBe('');
    expect(result.current.filters).toEqual({});
    expect(result.current.totalCount).toBe(20);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.data.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('paginates and the last page holds the remainder', () => {
    const { result } = renderHook(() => useDataTable({ data: rows }));
    act(() => result.current.setPage(2));
    expect(result.current.data.map((r) => r.id)).toEqual([17, 18, 19, 20]);
  });

  it('page beyond range yields empty data', () => {
    const { result } = renderHook(() => useDataTable({ data: rows }));
    act(() => result.current.setPage(10));
    expect(result.current.data).toEqual([]);
  });

  it('respects a custom perPage', () => {
    const { result } = renderHook(() => useDataTable({ data: rows, perPage: 5 }));
    expect(result.current.totalPages).toBe(4);
    expect(result.current.data).toHaveLength(5);
    expect(result.current.perPage).toBe(5);
  });

  it('exact multiple of perPage gives no extra page', () => {
    const { result } = renderHook(() => useDataTable({ data: rows.slice(0, 16) }));
    expect(result.current.totalPages).toBe(2);
  });

  it('empty data gives zero pages', () => {
    const { result } = renderHook(() => useDataTable<Row>({ data: [] }));
    expect(result.current.totalPages).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.data).toEqual([]);
  });

  it('uses initialFilters', () => {
    const { result } = renderHook(() => useDataTable({ data: rows, filterFn, initialFilters: { kind: 'even' } }));
    expect(result.current.filters).toEqual({ kind: 'even' });
    expect(result.current.totalCount).toBe(10);
  });

  it('search filters via filterFn and resets page to 0', () => {
    const { result } = renderHook(() => useDataTable({ data: rows, filterFn }));
    act(() => result.current.setPage(2));
    act(() => result.current.setSearch('item 1'));
    expect(result.current.page).toBe(0);
    expect(result.current.search).toBe('item 1');
    // Item 1, 10..19
    expect(result.current.totalCount).toBe(11);
    expect(result.current.totalPages).toBe(2);
  });

  it('setFilters merges one key and resets page to 0', () => {
    const { result } = renderHook(() =>
      useDataTable({ data: rows, filterFn, initialFilters: { kind: 'all', other: 'x' } }),
    );
    act(() => result.current.setPage(1));
    act(() => result.current.setFilters('kind', 'odd'));
    expect(result.current.page).toBe(0);
    expect(result.current.filters).toEqual({ kind: 'odd', other: 'x' });
    expect(result.current.data.every((r) => r.kind === 'odd')).toBe(true);
    expect(result.current.totalCount).toBe(10);
  });

  it('search and filters combine', () => {
    const { result } = renderHook(() => useDataTable({ data: rows, filterFn }));
    act(() => result.current.setSearch('item 1'));
    act(() => result.current.setFilters('kind', 'even'));
    // even kind = ids 2,4,...; among 1,10..19 → 10,12,14,16,18
    expect(result.current.data.map((r) => r.id)).toEqual([10, 12, 14, 16, 18]);
  });

  it('no match yields empty result', () => {
    const { result } = renderHook(() => useDataTable({ data: rows, filterFn }));
    act(() => result.current.setSearch('zzz'));
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it('passes item, search and filters to filterFn', () => {
    const seen: [Row, string, Record<string, string>][] = [];
    const spy = (r: Row, s: string, f: Record<string, string>) => {
      seen.push([r, s, f]);
      return true;
    };
    renderHook(() => useDataTable({ data: rows.slice(0, 1), filterFn: spy, initialFilters: { a: 'b' } }));
    expect(seen[0]).toEqual([rows[0], '', { a: 'b' }]);
  });

  it('reacts to new data from props', () => {
    const { result, rerender } = renderHook(({ data }) => useDataTable({ data }), { initialProps: { data: rows } });
    rerender({ data: rows.slice(0, 3) });
    expect(result.current.totalCount).toBe(3);
    expect(result.current.totalPages).toBe(1);
  });

  // BUG: page is never clamped when the data shrinks (e.g. deleting the only row on the last page),
  // so the table shows an empty page with "page 3 of 2". useDataTable.ts:17-31
  it.todo('clamps page to the last available page when data shrinks — currently stays out of range');
});
