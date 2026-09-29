import * as XLSX from 'xlsx';
import { exportToExcel } from './excel';

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({ sheet: true })),
    book_new: vi.fn(() => ({ book: true })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('exportToExcel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('builds a workbook from JSON rows and writes <fileName>.xlsx', async () => {
    const rows = [{ a: 1 }, { a: 2 }];
    await exportToExcel(rows, 'bemorlar', 'Bemorlar');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(rows);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith({ book: true }, { sheet: true }, 'Bemorlar');
    expect(XLSX.writeFile).toHaveBeenCalledWith({ book: true }, 'bemorlar.xlsx');
  });

  it('defaults the sheet name to Sheet1', async () => {
    await exportToExcel([], 'x');
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'Sheet1');
  });
});
