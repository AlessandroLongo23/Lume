import type { ColumnMapping } from '@/lib/imports/llmMapper';
import type { RowResult } from '@/lib/imports/clientImportSchema';

export type ImportJobStatus =
  | 'uploading'
  | 'queued'
  | 'parsing'
  | 'awaiting_review'
  | 'committing'
  | 'completed'
  | 'partial_failure'
  | 'needs_concierge'
  | 'failed'
  | 'cancelled';

export interface ImportJobMappingPayload {
  mappings: ColumnMapping[];
  warnings?: string[];
  usedLLM?: boolean;
  confirmedByUser?: boolean;
}

export interface ImportJobPreview {
  usedLLM: boolean;
  warnings: string[];
  sample: RowResult[];
  previewRowCount: number;
}

export interface ImportJob {
  id: string;
  salon_id: string;
  created_by: string;
  entity: 'clients';
  source_filename: string;
  source_size_bytes: number | null;
  storage_path: string;
  status: ImportJobStatus;
  total_rows: number | null;
  processed_rows: number;
  skipped_rows: number;
  failed_rows: number;
  mapping_json: ImportJobMappingPayload | null;
  preview_json: ImportJobPreview | null;
  error_log: { rows: Extract<RowResult, { ok: false }>[] } | null;
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
}
