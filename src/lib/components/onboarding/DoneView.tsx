'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Check, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { DURATION } from '@/lib/const/motion';
import { AnimatedCount } from './AnimatedCount';
import { FileIcon } from './fileIcons';
import {
  EASE_OUT,
  ENTITY_LABELS_PLURAL,
  type OnboardingState,
  type ChildState,
} from './onboardingTypes';

interface DoneViewProps {
  state: OnboardingState;
  jobs: ChildState[];
  onOpenCalendar: () => void;
  onReviewPending: (jobId: string) => void;
  busy: boolean;
}

/**
 * Final screen. Two flavors:
 *
 * - Success ('completed'): hero check, total record count, per-entity
 *   breakdown, primary CTA into the calendar.
 * - Partial ('partial_failure' | 'reviewing'): warmer hero, the same
 *   breakdown of what landed, plus a "deferred" panel naming files that
 *   need the operator's eyes (with reasons) and files the Lume team is
 *   handling. The owner leaves with no questions about their data.
 */
export function DoneView({ state, jobs, onOpenCalendar, onReviewPending, busy }: DoneViewProps) {
  const reduceMotion = useReducedMotion();
  const summary = state.summary_json ?? {};

  const importedEntries = Object.entries(summary)
    .filter(([k, v]) => k !== 'unclassifiedFiles' && typeof v === 'number' && (v as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number)) as [string, number][];

  const totalRows = importedEntries.reduce((acc, [, v]) => acc + v, 0);

  const conciergeChildren = jobs.filter((c) => c.status === 'needs_concierge');
  const reviewChildren = jobs.filter(
    (c) => c.status === 'awaiting_review' && !c.auto_commit_eligible,
  );
  const isPartial = state.status === 'partial_failure' || state.status === 'reviewing';

  const headline = isPartial ? 'Quasi pronto.' : 'Importazione completata.';
  const tailLine = isPartial ? 'Il resto lo vedi qui sotto.' : 'Sono pronti da usare.';

  return (
    <motion.div
      key="done"
      className="w-full max-w-2xl px-8 select-none"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: DURATION.enter, ease: EASE_OUT }}
    >
      <div className="text-center">
        <motion.div
          className="surface-card mx-auto mb-6 flex size-16 items-center justify-center"
          initial={reduceMotion ? false : { scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: 0.1 }}
        >
          {isPartial ? (
            <Sparkles className="size-7 text-[var(--lume-text-secondary)]" strokeWidth={1.75} />
          ) : (
            <Check className="size-8 text-success-strong" strokeWidth={2.25} />
          )}
        </motion.div>

        <motion.h1
          className="text-4xl font-medium tracking-tight text-[var(--lume-text)]"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: 0.2 }}
        >
          {headline}
        </motion.h1>

        <motion.p
          className="mx-auto mt-3 max-w-md text-sm text-[var(--lume-text-muted)]"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: 0.28 }}
        >
          {totalRows > 0 ? (
            <>
              Ho importato{' '}
              <span className="text-[var(--lume-text)] tabular-nums">
                <AnimatedCount value={totalRows} />
              </span>{' '}
              record nel tuo salone. {tailLine}
            </>
          ) : (
            tailLine
          )}
        </motion.p>
      </div>

      {importedEntries.length > 0 && (
        <motion.section
          className="surface-card mt-8 p-5"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: 0.4 }}
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-[var(--lume-text)]">Cosa è entrato</h2>
            <span className="text-xs text-[var(--lume-text-muted)] tabular-nums">
              {totalRows.toLocaleString('it-IT')} record
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-y-1.5 sm:grid-cols-2 sm:gap-x-8">
            {importedEntries.map(([entity, count]) => (
              <li key={entity} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-[var(--lume-text-muted)]">
                  {ENTITY_LABELS_PLURAL[entity] ?? entity}
                </span>
                <span className="text-[var(--lume-text)] tabular-nums">
                  {count.toLocaleString('it-IT')}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {isPartial && (reviewChildren.length > 0 || conciergeChildren.length > 0) && (
        <motion.section
          className="surface-card mt-4 p-5"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: 0.5 }}
        >
          <h2 className="mb-4 text-sm font-medium text-[var(--lume-text)]">In sospeso</h2>

          {reviewChildren.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-[var(--lume-text)]">
                {reviewChildren.length === 1
                  ? '1 file aspetta la tua occhiata'
                  : `${reviewChildren.length} file aspettano la tua occhiata`}
              </p>
              <ul className="space-y-2">
                {reviewChildren.map((child) => (
                  <li key={child.id} className="flex items-start gap-3 text-sm">
                    <FileIcon
                      filename={child.source_filename}
                      className="mt-0.5 size-4 shrink-0 text-[var(--lume-text-muted)]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[var(--lume-text)]">
                        {child.source_filename}
                      </span>
                      {child.mapping_json?.classification?.reason && (
                        <span className="block text-xs text-[var(--lume-text-muted)]">
                          {child.mapping_json.classification.reason}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {conciergeChildren.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--lume-text)]">
                {conciergeChildren.length === 1
                  ? '1 file lo gestisce il team Lume'
                  : `${conciergeChildren.length} file li gestisce il team Lume`}
              </p>
              <ul className="space-y-2">
                {conciergeChildren.map((child) => (
                  <li key={child.id} className="flex items-start gap-3 text-sm">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning-strong" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[var(--lume-text)]">
                        {child.source_filename}
                      </span>
                      {(child.failure_reason ?? child.mapping_json?.classification?.reason) && (
                        <span className="block text-xs text-[var(--lume-text-muted)]">
                          {child.failure_reason ?? child.mapping_json?.classification?.reason}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-[var(--lume-text-muted)]">
                Ti scriviamo via email appena pronti.
              </p>
            </div>
          )}
        </motion.section>
      )}

      <motion.div
        className="mt-8 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end"
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.enter, ease: EASE_OUT, delay: 0.6 }}
      >
        {reviewChildren.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => onReviewPending(reviewChildren[0].id)}
            disabled={busy}
          >
            Rivedi i file in sospeso
          </Button>
        )}
        <Button variant="primary" onClick={onOpenCalendar} disabled={busy}>
          {busy ? 'Apro il calendario…' : 'Apri il calendario'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
