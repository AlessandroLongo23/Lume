import 'server-only';
import type { ImportEntity } from '../entities/types';

/**
 * Static dependency waves: every entity in wave N must be committed before
 * any entity in wave N+1, because rows in wave N+1 may reference them by FK.
 *
 * Within a wave, entities can commit in parallel (their target tables are
 * disjoint), so the orchestrator fans out via Inngest.
 */
export const COMMIT_WAVES: ReadonlyArray<readonly ImportEntity[]> = [
  ['productCategories', 'manufacturers', 'suppliers', 'serviceCategories', 'clientCategories'],
  ['services', 'products', 'operators'],
  ['clients'],
  ['fiches'],
] as const;

/** Index of the wave the entity belongs to, or -1 if not committable. */
export function commitWaveOf(entity: ImportEntity): number {
  for (let i = 0; i < COMMIT_WAVES.length; i++) {
    if (COMMIT_WAVES[i].includes(entity)) return i;
  }
  return -1;
}
