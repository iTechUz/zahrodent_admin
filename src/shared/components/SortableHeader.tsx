import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/shared/lib/utils';
import type { SortState } from '@/shared/hooks/useServerTable';
import { ariaSort } from '@/shared/lib/sort';

/** Clickable header label with the asc/desc/unsorted icon (used by DataTable and SortableTableHead). */
export function SortButton({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: React.ReactNode;
  sortKey: string;
  sort?: SortState;
  onSort: (sortBy: string) => void;
}) {
  const active = sort?.sortBy === sortKey;
  const Icon = active ? (sort?.order === 'desc' ? ArrowDown : ArrowUp) : ArrowUpDown;
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 hover:text-foreground transition-colors',
        active && 'text-foreground',
      )}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <Icon className={cn('w-3.5 h-3.5', !active && 'opacity-40')} aria-hidden />
    </button>
  );
}

/** shadcn `<TableHead>` that sorts on click (server-side `sortBy`/`order`). */
export function SortableTableHead({
  children,
  sortKey,
  sort,
  onSort,
  className,
}: {
  children: React.ReactNode;
  sortKey: string;
  sort?: SortState;
  onSort: (sortBy: string) => void;
  className?: string;
}) {
  return (
    <TableHead className={className} aria-sort={ariaSort(sort, sortKey)}>
      <SortButton label={children} sortKey={sortKey} sort={sort} onSort={onSort} />
    </TableHead>
  );
}
