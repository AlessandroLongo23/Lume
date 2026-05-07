import 'server-only';
import * as XLSX from 'xlsx';
import { parseSingleSheet } from './parseFile';
import type { ParsedFile } from './parseFile';

export interface WorkbookSheet {
  /** Original sheet name as it appears in the workbook. */
  sheetName: string;
  parsed: ParsedFile;
}

/**
 * Reads a multi-sheet Excel workbook and returns one `ParsedFile` per sheet.
 * Empty sheets are dropped — they're not worth a child import_jobs row.
 *
 * Onboarding uploads typically include one workbook with several tabs (e.g.
 * Clienti / Operatori / Servizi / Appuntamenti). Each sheet becomes its own
 * child job so the LLM classifier and column mapper can treat them
 * independently.
 */
export function splitWorkbook(buffer: ArrayBuffer): WorkbookSheet[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: false });
  const out: WorkbookSheet[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const parsed = parseSingleSheet(sheet);
    if (parsed.rows.length === 0) continue;
    out.push({ sheetName, parsed });
  }
  return out;
}

/** True when the file is a multi-sheet workbook the orchestrator should split. */
export function isWorkbook(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext === 'xlsx' || ext === 'xls';
}

/** Returns the sheet names of a workbook without parsing the cell data. */
export function listSheetNames(buffer: ArrayBuffer): string[] {
  const wb = XLSX.read(buffer, { type: 'array', bookSheets: true });
  return [...wb.SheetNames];
}
