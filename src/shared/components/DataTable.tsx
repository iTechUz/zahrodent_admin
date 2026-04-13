import React, { memo } from 'react';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableRowProps<T> {
  item: T;
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  idAccessor: keyof T;
  rowIndex: number;
}

// Optimized Row Component
const DataTableRow = memo(<T extends { id?: string | number }>({ 
  item, 
  columns, 
  onEdit, 
  onDelete, 
  onView, 
  idAccessor, 
  rowIndex 
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
                  O'chirish
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
}

export const DataTable = memo(<T extends { id?: string | number }>({ 
  data, 
  columns, 
  onEdit, 
  onDelete, 
  onView,
  idAccessor = 'id' as keyof T,
  isLoading 
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
              {columns.map((column, i) => (
                <th 
                  key={i} 
                  className={`text-left px-4 py-3 font-medium text-muted-foreground ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amallar</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <DataTableRow 
                key={String(item[idAccessor] || index)}
                item={item}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
                idAccessor={idAccessor}
                rowIndex={index}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}) as <T>(props: DataTableProps<T>) => JSX.Element;
