import type { ImportEntity } from '@/lib/imports/entities/types';

export type OnboardingImportStatus =
  | 'pending'
  | 'uploading'
  | 'classifying'
  | 'mapping'
  | 'reviewing'
  | 'committing'
  | 'completed'
  | 'partial_failure'
  | 'skipped'
  | 'failed';

/** Per-entity counts written into onboarding_imports.summary_json after commit. */
export type OnboardingSummary = Partial<Record<ImportEntity, number>> & {
  /** Files that ended up in needs_concierge — surfaced in the done screen banner. */
  unclassifiedFiles?: number;
};

export interface OnboardingImport {
  id: string;
  salon_id: string;
  created_by: string;
  status: OnboardingImportStatus;
  file_count: number;
  classified_count: number;
  committed_count: number;
  summary_json: OnboardingSummary | null;
  failure_reason: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}
