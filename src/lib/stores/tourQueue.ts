import { create } from 'zustand';
import { getTutorialById } from '@/lib/tutorials/registry';
import { resolveTutorialChain } from '@/lib/tutorials/chain';

/**
 * Drives a chained run of tutorials (the "chain separate tutorials" prerequisite
 * model). When a tutorial's data prerequisites aren't met, its prerequisites'
 * own tutorials run first, then the original resumes.
 *
 * The imperative NextStep calls (`startNextStep`, routing) must happen INSIDE
 * `<NextStepProvider>`, but `<NextStep onComplete/onSkip>` is wired in the layout
 * (outside the provider's hook scope). So those handlers only record what happened
 * via `notifyFinished`; the under-provider `TourBridge` reads `pendingFinish` and
 * performs the advance/abort + navigation.
 */
interface PendingFinish {
  tourName: string | null;
  type: 'complete' | 'skip';
}

interface TourQueueState {
  /** Remaining tutorial ids to run; head is the current one. */
  queue: string[];
  /** Tutorial ids already run this session — loop guard against a tour whose
   *  prerequisite predicate stays false (user clicked through without acting). */
  completed: string[];
  /** Where to return when the whole chain finishes (target tutorial's help page). */
  finalEndRoute: string | null;
  /** The originally-requested tutorial; re-resolved each hop to collapse satisfied prereqs. */
  targetId: string | null;
  /** True while a chain is running. */
  active: boolean;
  /** Transient signal from the layout's onComplete/onSkip, consumed by TourBridge. */
  pendingFinish: PendingFinish | null;

  /** Resolve `targetId`'s chain and begin. Returns the first tour id to start, or null. */
  start: (targetId: string, finalEndRoute: string | null) => string | null;
  /** Mark the current tour done, re-resolve, and return the next tour id (or null when finished). */
  advance: () => string | null;
  /** Abandon the whole chain (e.g. user skipped a prerequisite tour). */
  abort: () => void;
  /** Record that a tour finished, for TourBridge to act on. */
  notifyFinished: (tourName: string | null, type: 'complete' | 'skip') => void;
  /** Clear the transient finish signal. */
  consumeFinish: () => void;
}

const tourIdFor = (tutorialId: string): string | null =>
  getTutorialById(tutorialId)?.tourId ?? null;

/** Keep only ids that aren't already run and that have a runnable tour. */
const runnable = (ids: string[], completed: string[]): string[] =>
  ids.filter((id) => !completed.includes(id) && tourIdFor(id));

export const useTourQueueStore = create<TourQueueState>((set, get) => ({
  queue: [],
  completed: [],
  finalEndRoute: null,
  targetId: null,
  active: false,
  pendingFinish: null,

  start: (targetId, finalEndRoute) => {
    const ids = runnable(resolveTutorialChain(targetId).queue, []);
    if (ids.length === 0) {
      set({ queue: [], completed: [], targetId, finalEndRoute, active: false });
      return null;
    }
    set({ queue: ids, completed: [], targetId, finalEndRoute, active: true });
    return tourIdFor(ids[0]);
  },

  advance: () => {
    const { targetId, queue, completed } = get();
    if (!targetId) return null;
    const nextCompleted = queue[0] ? [...completed, queue[0]] : completed;
    // Re-resolve against current live state: anything the user just created is
    // now `met()` and drops out, collapsing later hops.
    const remaining = runnable(resolveTutorialChain(targetId).queue, nextCompleted);
    if (remaining.length === 0) {
      set({ queue: [], completed: nextCompleted, active: false });
      return null;
    }
    set({ queue: remaining, completed: nextCompleted });
    return tourIdFor(remaining[0]);
  },

  abort: () =>
    set({ queue: [], completed: [], targetId: null, finalEndRoute: null, active: false }),

  notifyFinished: (tourName, type) => set({ pendingFinish: { tourName, type } }),
  consumeFinish: () => set({ pendingFinish: null }),
}));
