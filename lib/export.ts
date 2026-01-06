// Simple CSV export utility
// rows: array of objects
// headers: optional ordered list of { key, label } to control column order/labels
export function exportToCSV(
  filename: string,
  rows: Array<Record<string, any>>,
  headers?: Array<{ key: string; label: string }>
): void {
  if (typeof window === 'undefined' || !rows || rows.length === 0) return;

  const columns =
    headers && headers.length > 0
      ? headers
      : Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const escapeValue = (value: any) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    const needsQuotes = /[",\n]/.test(str);
    const escaped = str.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const headerLine = columns.map((col) => escapeValue(col.label)).join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeValue((row as any)[col.key])).join(',')
  );

  const csvContent = [headerLine, ...dataLines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

