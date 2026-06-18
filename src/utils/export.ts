import * as XLSX from 'xlsx';
import { ColumnDef } from '../types/table';

function formatValue(value: any, dataType: string): any {
  if (value === null || value === undefined) return '';

  switch (dataType) {
    case 'date':
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return String(value);
    case 'boolean':
      return value ? '是' : '否';
    default:
      return value;
  }
}

export function exportToXLSX<T>(
  data: T[],
  columns: ColumnDef<T>[],
  fileName: string = 'export.xlsx'
): void {
  const headerRow = columns.map((col) => col.title);
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = (row as any)[col.id];
      return formatValue(value, col.dataType);
    })
  );

  const wsData = [headerRow, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = columns.map((col) => ({
    wch: Math.max(Math.round(col.width / 7), 10),
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, fileName);
}

export function exportToCSV<T>(
  data: T[],
  columns: ColumnDef<T>[],
  fileName: string = 'export.csv'
): void {
  const escapeCSV = (value: any): string => {
    const str = String(formatValue(value, 'string'));
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = columns.map((col) => escapeCSV(col.title)).join(',');
  const rows = data
    .map((row) =>
      columns
        .map((col) => escapeCSV((row as any)[col.id]))
        .join(',')
    )
    .join('\n');

  const csvContent = '\uFEFF' + headerRow + '\n' + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}
