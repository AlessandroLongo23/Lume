import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { parseFile, type ParsedFile } from './parseFile';
import { extractPdfTable } from './pdfExtractor';
import type { EntityImportConfig } from '../entities/types';

/**
 * Single entry point used everywhere a job's `{ headers, rows }` is needed —
 * runProcess, runCommit, and the onboarding classifier — regardless of source
 * file type.
 *
 * - CSV / XLSX / TSV: download from storage, parse synchronously.
 * - PDF: download, extract via Claude. The result is cached as a sibling
 *   `<storage_path>.parsed.json` in the same bucket so subsequent passes
 *   (commit after review, or process after onboarding classification) reuse
 *   the same extraction without paying the LLM a second time.
 *
 * `config` is optional — pass it when the entity is already known so the PDF
 * prompt can include a domain hint; omit it during onboarding classification
 * (entity unknown until the classifier runs).
 */
export async function loadParsedFile(
  supabase: SupabaseClient,
  job: { storage_path: string; source_filename: string; source_sheet_name?: string | null },
  config?: EntityImportConfig,
): Promise<ParsedFile> {
  const ext = job.source_filename.toLowerCase().split('.').pop();

  if (ext === 'pdf') {
    const cachePath = `${job.storage_path}.parsed.json`;
    const cached = await tryReadCache(supabase, cachePath);
    if (cached) return cached;

    const buffer = await downloadBuffer(supabase, job.storage_path);
    const parsed = await extractPdfTable(buffer, config);
    await writeCache(supabase, cachePath, parsed);
    return parsed;
  }

  const buffer = await downloadBuffer(supabase, job.storage_path);
  return parseFile(buffer, job.source_filename, job.source_sheet_name);
}

async function downloadBuffer(supabase: SupabaseClient, path: string): Promise<ArrayBuffer> {
  const { data: blob, error } = await supabase.storage.from('imports').download(path);
  if (error || !blob) throw new Error(`storage download failed: ${error?.message}`);
  return blob.arrayBuffer();
}

async function tryReadCache(supabase: SupabaseClient, path: string): Promise<ParsedFile | null> {
  const { data, error } = await supabase.storage.from('imports').download(path);
  if (error || !data) return null;
  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as ParsedFile;
    if (Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function writeCache(supabase: SupabaseClient, path: string, parsed: ParsedFile): Promise<void> {
  const body = JSON.stringify(parsed);
  const { error } = await supabase.storage.from('imports').upload(path, body, {
    upsert: true,
    contentType: 'application/json',
  });
  if (error) {
    // Cache write failure is non-fatal — the next read just re-extracts.
    console.warn('[loadParsedFile] cache write failed:', error.message);
  }
}
