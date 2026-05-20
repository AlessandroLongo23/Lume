import { getTutorialById, tutorials } from './registry';

/**
 * Result of resolving a tutorial's prerequisite chain against live store state.
 */
export interface ChainResolution {
  /**
   * Ordered tutorial ids to run: every UNMET prerequisite first (dependencies
   * before dependents), then the target last. A fully-satisfied target yields
   * just `[targetId]`.
   */
  queue: string[];
  /** Plain-Italian labels of the prerequisite tutorials being inserted, for the preflight. */
  prereqLabels: string[];
  /** Prerequisites whose `tutorialId` is missing from the registry (author warning). */
  missing: { label: string; tutorialId: string }[];
}

/**
 * Walks `targetId`'s prerequisites depth-first (post-order, so dependencies are
 * queued before the things that depend on them), pruning any prerequisite whose
 * `met()` already returns true. Cycles and duplicates are guarded by a `visited`
 * set; a prerequisite pointing at a tutorial that isn't registered is reported in
 * `missing` (and skipped) rather than throwing.
 *
 * Re-running this with current live state is the mechanism the tour queue uses to
 * collapse hops the user satisfied mid-chain.
 */
export function resolveTutorialChain(targetId: string): ChainResolution {
  const queue: string[] = [];
  const prereqLabels: string[] = [];
  const missing: { label: string; tutorialId: string }[] = [];
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (visited.has(id)) return; // cycle back-edge or already-queued — skip
    visited.add(id);

    const tutorial = getTutorialById(id);
    for (const prereq of tutorial?.prerequisites ?? []) {
      if (prereq.met()) continue; // requirement already satisfied — prune
      if (!getTutorialById(prereq.tutorialId)) {
        missing.push({ label: prereq.label, tutorialId: prereq.tutorialId });
        continue; // graceful: no tutorial to chain to
      }
      prereqLabels.push(prereq.label);
      visit(prereq.tutorialId); // recurse: its own deps get queued first
    }

    // Post-order: append after dependencies. Never enqueue the target as its own prereq.
    if (!queue.includes(id)) queue.push(id);
  };

  visit(targetId);
  return { queue, prereqLabels, missing };
}

// Re-export so callers can resolve ids without a second import.
export { getTutorialById, tutorials };
