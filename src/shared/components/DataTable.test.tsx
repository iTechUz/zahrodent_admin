import { fireEvent, render, screen } from '@testing-library/react';
import { DataTable, type Column } from './DataTable';

type Row = { id: string; name: string; age: number };
const rows: Row[] = [{ id: '1', name: 'Ali', age: 30 }];
const columns: Column<Row>[] = [
  { header: 'Ism', accessor: 'name', sortKey: 'firstName' },
  { header: 'Yosh', accessor: 'age', sortKey: 'age' },
  { header: 'Izoh', accessor: () => '—' },
];

describe('DataTable sorting', () => {
  it('headers with a sortKey are buttons that report the backend field', () => {
    const onSortChange = vi.fn();
    render(<DataTable data={rows} columns={columns} sort={{}} onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Yosh' }));
    expect(onSortChange).toHaveBeenCalledWith('age');
    fireEvent.click(screen.getByRole('button', { name: 'Ism' }));
    expect(onSortChange).toHaveBeenLastCalledWith('firstName');
    expect(screen.queryByRole('button', { name: 'Izoh' })).toBeNull();
  });

  it('marks the active column with aria-sort', () => {
    render(<DataTable data={rows} columns={columns} sort={{ sortBy: 'age', order: 'desc' }} onSortChange={vi.fn()} />);
    expect(screen.getByRole('columnheader', { name: 'Yosh' })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: 'Ism' })).not.toHaveAttribute('aria-sort');
  });

  it('without onSortChange headers are plain text', () => {
    render(<DataTable data={rows} columns={columns} />);
    expect(screen.queryByRole('button', { name: 'Yosh' })).toBeNull();
  });

  it('deleteLabel renames the row delete action', () => {
    render(<DataTable data={rows} columns={columns} onDelete={vi.fn()} deleteLabel="Arxivlash" />);
    expect(screen.getByRole('columnheader', { name: 'Amallar' })).toBeInTheDocument();
  });
});
