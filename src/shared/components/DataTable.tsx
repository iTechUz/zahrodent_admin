import React, { memo } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
} from 'lucide-react';
import { SortButton } from './SortableHeader';
import { ariaSort } from '@/shared/lib/sort';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  /** backend `sortBy` field — makes the header clickable */
  sortKey?: string;
}

export interface DataTableSort {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface DataTableRowProps<T> {
  item: T;
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  idAccessor: keyof T;
  rowIndex: number;
  deleteLabel: string;
}

// Optimized Row Component
const DataTableRow = memo(<T extends { id?: string | number }>({ 
  item, 
  columns, 
  onEdit, 
  onDelete, 
  onView, 
  idAccessor, 
  rowIndex,
  deleteLabel,
}: DataTableRowProps<T>) => {
  const itemId = String(item[idAccessor] || rowIndex);
  
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      {columns.map((column, colIndex) => (
        <td key={colIndex} className={`px-4 py-3 ${column.className || ''}`}>
          {typeof column.accessor === 'function' 
            ? column.accessor(item) 
            : (item[column.accessor] as React.ReactNode)}
        </td>
      ))}
      {(onEdit || onDelete || onView) && (
        <td className="px-4 py-3 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(item)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ko'rish
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Tahrirlash
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={() => onDelete(itemId)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteLabel}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      )}
    </tr>
  );
}) as <T>(props: DataTableRowProps<T>) => JSX.Element;

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  idAccessor?: keyof T;
  isLoading?: boolean;
  sort?: DataTableSort;
  onSortChange?: (sortBy: string) => void;
  /** row menu text for onDelete (e.g. "Arxivlash" for a soft delete) */
  deleteLabel?: string;
}

export const DataTable = memo(<T extends { id?: string | number }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onView,
  idAccessor = 'id' as keyof T,
  isLoading,
  sort,
  onSortChange,
  deleteLabel = "O'chirish",
}: DataTableProps<T>) => {
  if (!isLoading && data.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((column, i) => {
                const sortable = !!(column.sortKey && onSortChange);
                return (
                  <th
                    key={i}
                    className={`text-left px-4 py-3 font-medium text-muted-foreground ${column.className || ''}`}
                    aria-sort={sortable ? ariaSort(sort, column.sortKey) : undefined}
                  >
                    {sortable ? (
                      <SortButton label={column.header} sortKey={column.sortKey!} sort={sort} onSort={onSortChange!} />
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {(onEdit || onDelete || onView) && (
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amallar</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0 h-12">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : (
              data.map((item, index) => (
                <DataTableRow 
                  key={String(item[idAccessor] || index)}
                  item={item}
                  columns={columns}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={onView}
                  idAccessor={idAccessor}
                  rowIndex={index}
                  deleteLabel={deleteLabel}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}) as <T>(props: DataTableProps<T>) => JSX.Element;
