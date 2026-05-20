import type { Step, Tour } from 'nextstepjs';

/**
 * Tutorial taxonomy. Two small, fixed facets — the hub lets the user group the
 * same list either way (a learning path by complexity, or a deep-dive by area).
 * Keep these closed unions: the UI renders labels/colours from them, so adding a
 * value here is a deliberate, reviewed change.
 */
export type Complexity = 'base' | 'avanzato' | 'power';

export type Scope =
  | 'generale'
  | 'agenda'
  | 'clienti'
  | 'servizi'
  | 'prodotti'
  | 'fiches'
  | 'bilancio'
  | 'operatori';

export const COMPLEXITY_ORDER: Complexity[] = ['base', 'avanzato', 'power'];

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  base: 'Base',
  avanzato: 'Avanzato',
  power: 'Power user',
};

export const SCOPE_ORDER: Scope[] = [
  'generale',
  'agenda',
  'clienti',
  'servizi',
  'prodotti',
  'fiches',
  'bilancio',
  'operatori',
];

export const SCOPE_LABELS: Record<Scope, string> = {
  generale: 'Generale',
  agenda: 'Agenda',
  clienti: 'Clienti',
  servizi: 'Servizi',
  prodotti: 'Prodotti',
  fiches: 'Fiches',
  bilancio: 'Bilancio',
  operatori: 'Operatori',
};

/**
 * A data condition a tutorial needs before its action makes sense — e.g. "apply
 * a discount" needs a coupon to exist. When `met()` is false at launch, the
 * Help Center chains the prerequisite's own tutorial (`tutorialId`) first, then
 * resumes the original (see `chain.ts` / `tourQueue.ts`).
 *
 * `met` is a thunk (not a precomputed boolean) so it is re-evaluated live at
 * each hop of a chain — data created during an earlier step prunes later ones.
 * Predicates live in `./prerequisites` (they read Zustand stores, so any tutorial
 * carrying `prerequisites` is a client-only artifact — never import the registry
 * with prerequisites from a server component).
 */
export interface Prerequisite {
  /** Plain-Italian label for the preflight list, e.g. "almeno un cliente". */
  label: string;
  /** Live predicate over the stores; `true` ⇒ the requirement is already met. */
  met: () => boolean;
  /** Tutorial id to run fully if `met()` is false. */
  tutorialId: string;
}

/** One learning topic, taught in three modalities (video + article + guide). */
export interface Tutorial {
  id: string;
  /** URL segment under /admin/aiuto */
  slug: string;
  title: string;
  summary: string;
  complexity: Complexity;
  scopes: Scope[];
  /** Path inside the Supabase `tutorials` storage bucket (Phase 4). */
  videoPath?: string;
  /** Key used to resolve the MDX/article body (Phase 4). */
  articleSlug?: string;
  /** Id of the matching interactive tour in the tours registry, if any. */
  tourId?: string;
  /**
   * Optional centred welcome splash shown before the tour starts. Kept separate
   * from NextStep steps so it can be perfectly centred and cross-fade into the
   * first (anchored) step without the engine's fixed↔absolute position snap.
   */
  welcome?: { title: string; body: string };
  /**
   * The start-of-life intro tutorial. Runs on an empty platform and auto-marks
   * complete once the salon's first appointment exists (Phase 3). It stays in
   * the hub but hides its interactive-guide button once data exists.
   */
  isIntro?: boolean;
  /**
   * Data conditions required before this tutorial's action is possible. Unmet
   * ones are resolved by chaining their own tutorials first (see `Prerequisite`).
   */
  prerequisites?: Prerequisite[];
}

/** A tour step is interactive (`action`) or just explained (`narrate`). */
export type TourMode = 'narrate' | 'action';

/**
 * Lume's step extends NextStepjs's `Step` with the per-step mode (the "hybrid")
 * and, for action steps, the bridge event that advances the tour once the user
 * actually performs the action (wired in Phase 3 via `useTourBridge`).
 */
export interface LumeTourStep extends Step {
  mode?: TourMode;
  /** Event name an `action` step waits for before auto-advancing. */
  completeOn?: string;
  /**
   * For an `action` step whose action is navigation: the route the user reaches
   * by clicking the highlighted element. `TourBridge` advances the tour once the
   * app navigates here (so clicking the real sidebar button drives the tour).
   */
  advanceOnRoute?: string;
  /**
   * For an `action` step that fills a text field: a CSS selector to the input the
   * user types into. `TourCard` keeps "Avanti" disabled while that input is empty
   * and enables it once it has a value, so the user finishes typing and clicks
   * Avanti to advance (no auto-jump mid-typing, no clicking other elements —
   * works under the click-locking overlay).
   */
  advanceWhenFilled?: string;
  /**
   * Marks a step whose highlighted field is OPTIONAL (e.g. a service's price or
   * description). `TourCard` keeps "Avanti" enabled (no gating) and renders a
   * quiet "Salta" button beside it — both advance — so the user can edit the
   * field or move on. Mutually exclusive with `advanceWhenFilled` (which is for
   * required fields).
   */
  optional?: boolean;
}

export interface LumeTour extends Tour {
  steps: LumeTourStep[];
  /** Route opened when the tour starts, so step 0 is shown on the right page. */
  startRoute?: string;
  /** Route to return to when the tour completes or is skipped. */
  endRoute?: string;
}
