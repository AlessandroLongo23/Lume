/**
 * Shared types and labels for the onboarding wizard. Kept in a separate file
 * so each view component can import without pulling in the others.
 */

import type { OnboardingImportStatus, OnboardingSummary } from '@/lib/types/OnboardingImport';

export interface OnboardingState {
  id: string;
  status: OnboardingImportStatus;
  file_count: number;
  classified_count: number;
  committed_count: number;
  summary_json: OnboardingSummary | null;
  failure_reason: string | null;
}

export interface ChildState {
  id: string;
  entity: string | null;
  status: string;
  source_filename: string;
  source_sheet_name: string | null;
  processed_rows: number;
  total_rows: number | null;
  auto_commit_eligible: boolean;
  failure_reason: string | null;
  mapping_json: { classification?: { reason: string } } | null;
}

/** Plural Italian labels used in counts on the magic and done screens. */
export const ENTITY_LABELS_PLURAL: Record<string, string> = {
  clients:           'clienti',
  clientCategories:  'categorie clienti',
  operators:         'operatori',
  services:          'servizi',
  serviceCategories: 'categorie servizi',
  products:          'prodotti',
  productCategories: 'categorie prodotti',
  manufacturers:     'marchi',
  suppliers:         'fornitori',
  fiches:            'appuntamenti',
};

/** Statuses that mean the orchestrator is finished — UI flips to DoneView. */
export const TERMINAL_STATUSES: ReadonlySet<OnboardingImportStatus> = new Set([
  'completed',
  'partial_failure',
  'skipped',
  'failed',
  'reviewing',
]);

/**
 * Cubic-bezier mirroring `--ease-out` from src/styles/tokens/primitives.css.
 * Imported by every onboarding view so motion stays in lockstep with the
 * documented system instead of an inline literal per file.
 */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
