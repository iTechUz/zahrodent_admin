/**
 * Excel export. `xlsx` (~400 kB) is loaded on demand so it stays out of the main bundle.
 */
export const exportToExcel = async (
  data: Record<string, unknown>[],
  fileName: string,
  sheetName: string = 'Sheet1',
): Promise<void> => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Create a blob and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
