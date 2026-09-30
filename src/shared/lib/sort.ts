import type { SortState } from '@/shared/hooks/useServerTable';

/** `aria-sort` value for a header (undefined when this column is not the sorted one). */
export function ariaSort(sort: SortState | undefined, key: string | undefined) {
  if (!key || sort?.sortBy !== key) return undefined;
  return sort.order === 'desc' ? 'descending' : 'ascending';
}
