import * as XLSX from 'xlsx';

// Shape used by all three exporters. Tables provide a flat list of
// {label, accessor} pairs — accessor returns a primitive (no JSX, no badges)
// so the same descriptor feeds CSV, XLSX, and the print-to-PDF view.
//
// React/TanStack column defs are not reused here because their `cell` returns
// JSX (badges, formatted spans, links). A separate descriptor keeps the export
// data clean and lets each table choose what makes sense to ship out.
export type ExportColumn<T> = {
  label: string;
  accessor: (row: T) => string | number | Date | boolean | null | undefined;
};

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.toLocaleDateString('it-IT');
  }
  if (typeof value === 'boolean') return value ? 'Sì' : 'No';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return String(value);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Italian Excel uses ; as the field separator (because , is the decimal mark).
// We also prepend the UTF-8 BOM so Excel opens accented characters correctly.
export function exportCsv<T>(rows: T[], columns: ExportColumn<T>[], baseName: string): void {
  const sep = ';';
  const escape = (raw: string): string => {
    if (raw.includes(sep) || raw.includes('"') || raw.includes('\n') || raw.includes('\r')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const header = columns.map((c) => escape(c.label)).join(sep);
  const body = rows
    .map((row) => columns.map((c) => escape(formatCellValue(c.accessor(row)))).join(sep))
    .join('\n');

  const csv = `﻿${header}\n${body}`;
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `${baseName}-${timestamp()}.csv`,
  );
}

export function exportXlsx<T>(rows: T[], columns: ExportColumn<T>[], baseName: string): void {
  const aoa: (string | number | Date | boolean | null)[][] = [
    columns.map((c) => c.label),
    ...rows.map((row) =>
      columns.map((c) => {
        const v = c.accessor(row);
        if (v === undefined) return null;
        if (v instanceof Date && Number.isNaN(v.getTime())) return null;
        return v;
      }),
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
  // Column widths sized to the longest cell in each column (capped at 60ch).
  ws['!cols'] = columns.map((c) => {
    let max = c.label.length;
    for (const row of rows) {
      const v = formatCellValue(c.accessor(row));
      if (v.length > max) max = v.length;
      if (max >= 60) break;
    }
    return { wch: Math.min(max + 2, 60) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, baseName.slice(0, 31));
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  downloadBlob(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${baseName}-${timestamp()}.xlsx`,
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Opens an isolated print window so the printed view is just the table —
// no app chrome, no React state to fight with. The window auto-triggers the
// print dialog and closes itself afterwards.
export function exportPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  baseName: string,
  title: string,
): void {
  const headerHtml = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${columns.map((c) => `<td>${escapeHtml(formatCellValue(c.accessor(row)))}</td>`).join('')}</tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)} — ${escapeHtml(timestamp())}</title>
  <style>
    @page { size: A4 landscape; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif;
      color: #18181b;
      margin: 0;
      padding: 24px;
      font-size: 11px;
      line-height: 1.4;
    }
    header { margin-bottom: 16px; border-bottom: 2px solid #18181b; padding-bottom: 8px; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    .meta { color: #71717a; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #d4d4d8;
      padding: 5px 7px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f4f4f5; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Esportato il ${escapeHtml(new Date().toLocaleString('it-IT'))} · ${rows.length} righe</div>
  </header>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${bodyHtml}</tbody>
  </table>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => { window.print(); }, 100);
    });
    window.addEventListener('afterprint', () => { window.close(); });
  </script>
</body>
</html>`;

  // Use a Blob URL instead of document.write — Firefox returns null from
  // window.open() when 'noopener' is set (and we don't want to give the popup
  // a back-reference either way), so we can't reliably write to its document.
  // Loading a blob: URL skips that whole problem and the embedded script
  // handles printing + cleanup.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    alert('Abilita i popup per esportare in PDF.');
    return;
  }
  // Revoke after a delay so the new window has time to load the blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function exportTable<T>(
  format: ExportFormat,
  rows: T[],
  columns: ExportColumn<T>[],
  baseName: string,
  pdfTitle?: string,
): void {
  if (format === 'csv') return exportCsv(rows, columns, baseName);
  if (format === 'xlsx') return exportXlsx(rows, columns, baseName);
  if (format === 'pdf') return exportPdf(rows, columns, baseName, pdfTitle ?? baseName);
}
