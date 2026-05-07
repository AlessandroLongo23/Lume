import 'server-only';
import type { ColumnMapping, EntityImportConfig } from '../entities/types';
import type { MappingResult } from '../core/llmMapper';

export interface EligibilityVerdict {
  eligible: boolean;
  reason: string;
}

/**
 * Decides whether a single child import_jobs row can auto-commit during
 * onboarding without waiting for the user to confirm the mappings.
 *
 * The entity config's `hasRequiredCoverage` already encodes what "good
 * enough to import" means for each table — required fields with confidence
 * ≥ 0.6 (per-entity tunable). Stacking another blanket confidence floor on
 * top of that double-gates and disqualifies common cases:
 *
 *  - Smart transforms (products: sellPrice/isForRetail split). Treated as
 *    "complex" by an earlier draft of this rule, but they're a feature, not
 *    a smell, and have been the well-tested path for months.
 *  - Optional columns the LLM guessed at low confidence (e.g. products
 *    description at 0.80). Wrong-but-low-confidence values land in optional
 *    columns; the user can clean them up later. Not worth blocking the
 *    auto-commit for.
 *
 * Current rule: trust the entity's own coverage check + the mapping result
 * having no warnings. Warnings are populated when something's actually off
 * (insufficient required coverage, missing API key, dropped smart rule).
 */
export function evaluateAutoCommitEligibility(
  mappings: ColumnMapping[],
  config: EntityImportConfig,
  result?: Pick<MappingResult, 'warnings'>,
): EligibilityVerdict {
  if (!config.hasRequiredCoverage(mappings)) {
    return { eligible: false, reason: config.insufficientMappingReason };
  }

  if (result?.warnings && result.warnings.length > 0) {
    return {
      eligible: false,
      reason: `Avvisi durante la mappatura: ${result.warnings[0]}`,
    };
  }

  return { eligible: true, reason: 'Mappatura confidente.' };
}
