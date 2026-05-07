import type { ColumnMapping, FailedRow, ImportEntity, RowResult } from '@/lib/imports/entities/types';

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
  /** Raw source rows (parallel to `sample`) for showing per-column previews. */
  sourceSample?: Record<string, string>[];
  previewRowCount: number;
}

export interface ImportJob {
  id: string;
  salon_id: string;
  created_by: string;
  /** Null when the job is a child of an onboarding bulk-import that hasn't been
   *  classified yet. Required by the manual per-entity flow. */
  entity: ImportEntity | null;
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
  error_log: { rows: FailedRow[] } | null;
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
  /** Set when this job is part of a bulk onboarding import. */
  onboarding_id: string | null;
  /** Set by processOnboarding when the mapping is confident enough to skip review. */
  auto_commit_eligible: boolean;
  /** Set when this job represents one sheet of a split multi-sheet workbook. */
  source_sheet_name: string | null;
}
