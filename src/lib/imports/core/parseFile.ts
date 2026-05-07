import 'server-only';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parses a CSV or XLSX (or XLS) buffer into a uniform shape: array of headers
 * plus array of row objects keyed by those headers. All values are coerced to
 * strings so downstream transforms have a single type to handle.
 *
 * For workbooks, pass `sheetName` to read a specific sheet — needed by the
 * onboarding bulk-import flow, which splits multi-sheet workbooks into one
 * import_jobs row per sheet.
 */
export function parseFile(buffer: ArrayBuffer, filename: string, sheetName?: string | null): ParsedFile {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    return parseCsv(buffer);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return parseXlsx(buffer, sheetName);
  }

  throw new Error(`Estensione file non supportata: ${ext ?? '(sconosciuta)'}`);
}

function parseCsv(buffer: ArrayBuffer): ParsedFile {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });
  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === 'Quotes' || e.type === 'Delimiter');
    if (fatal) throw new Error(`CSV non valido: ${fatal.message}`);
  }
  const headers = (result.meta.fields ?? []).filter((h) => h && h.length > 0);
  const rows = (result.data ?? []).map((r) => stringifyRow(r));
  return { headers, rows };
}

function parseXlsx(buffer: ArrayBuffer, sheetName?: string | null): ParsedFile {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const target = sheetName && wb.Sheets[sheetName] ? sheetName : wb.SheetNames[0];
  if (!target) throw new Error('Foglio Excel vuoto');
  return parseSingleSheet(wb.Sheets[target]);
}

/**
 * Parses one sheet of an XLSX workbook into the same `ParsedFile` shape that
 * CSV produces. Used by `parseXlsx` for the single-sheet legacy path and by
 * `splitWorkbook` to fan out multi-sheet onboarding uploads.
 */
export function parseSingleSheet(sheet: XLSX.WorkSheet): ParsedFile {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
    blankrows: false,
  });
  if (json.length === 0) return { headers: [], rows: [] };
  const headers = Object.keys(json[0]).map((h) => h.trim()).filter(Boolean);
  const rows = json.map((r) => stringifyRow(r));
  return { headers, rows };
}

function stringifyRow(r: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) {
    const key = k.trim();
    if (!key) continue;
    if (v == null) out[key] = '';
    else if (typeof v === 'string') out[key] = v;
    else out[key] = String(v);
  }
  return out;
}
