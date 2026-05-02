/**
 * Shared dest-map builder for entity transformRow implementations. Consumes a
 * source row and a list of column mappings (some of which may carry a
 * SmartTransform) and produces a flat dest map keyed by destField.
 *
 * Simple-path mappings stash the raw string value at dest[destField]; smart
 * mappings stash whatever applySmartRules returns (may be number/boolean/null).
 * Each entity's coercion block must therefore tolerate both string and
 * pre-coerced inputs (typeof checks before parseNumber/parseBool).
 *
 * First writer wins: if multiple mappings target the same destField, the value
 * from whichever runs first sticks. This keeps later "always" fallback rules
 * on other columns from clobbering meaningful values that earlier columns set.
 */

import { applySmartRules } from './applySmartRules';
import type { ColumnMapping } from '../entities/types';

export function buildDestFromMappings<F extends string>(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  knownFields: readonly F[],
): Partial<Record<F, unknown>> {
  const dest: Partial<Record<F, unknown>> = {};
  const known = new Set<string>(knownFields as readonly string[]);

  for (const m of mappings) {
    if (m.confidence < 0.6) continue;
    const value = source[m.sourceColumn];

    if (m.smartTransform) {
      const writes = applySmartRules(value, m.smartTransform);
      for (const [field, val] of Object.entries(writes)) {
        if (!known.has(field)) continue;
        const f = field as F;
        if (dest[f] == null) dest[f] = val;
      }
      continue;
    }

    if (!m.destField) continue;
    if (value == null || value === '') continue;
    if (!known.has(m.destField)) continue;
    const f = m.destField as F;
    if (dest[f] == null) dest[f] = value;
  }

  return dest;
}
