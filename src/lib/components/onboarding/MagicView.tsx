'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { Button } from '@/lib/components/shared/ui/Button';
import { FileFeed } from './FileFeed';
import { EASE_OUT, type ChildState, type OnboardingState } from './onboardingTypes';

interface MagicViewProps {
  state: OnboardingState;
  jobs: ChildState[];
  onCancel: () => void;
  onContinueInBackground: () => void;
  busyContinue: boolean;
  busyCancel: boolean;
}

interface PhaseCopy {
  headline: string;
  subline: string;
}

const PHASE_COPY: Record<OnboardingState['status'], PhaseCopy> = {
  pending: {
    headline: 'Sto preparando tutto…',
    subline: 'Un momento, organizzo i file ricevuti.',
  },
  uploading: {
    headline: 'Sto ricevendo i file…',
    subline: 'Sto caricando in modo sicuro. Non chiudere la finestra.',
  },
  classifying: {
    headline: 'Sto leggendo i tuoi file.',
    subline: 'Capisco da solo cosa contiene ogni file. Tu non devi fare niente.',
  },
  mapping: {
    headline: 'Sto capendo la struttura.',
    subline: 'Riconosco le colonne e le abbino ai dati del tuo salone.',
  },
  reviewing: {
    headline: 'Quasi pronto.',
    subline: 'Alcuni file aspettano la tua occhiata.',
  },
  committing: {
    headline: 'Sto importando nel tuo salone.',
    subline: 'Resta qui o vai pure: continuo da solo.',
  },
  completed: {
    headline: 'Tutto pronto.',
    subline: 'Ho terminato.',
  },
  partial_failure: {
    headline: 'Quasi pronto.',
    subline: 'Ho importato quasi tutto.',
  },
  skipped: {
    headline: 'Importazione annullata.',
    subline: 'Quello che era già importato resta nel tuo salone.',
  },
  failed: {
    headline: 'Qualcosa è andato storto.',
    subline: 'Riprova tra poco; nel frattempo, niente è andato perso.',
  },
};

/**
 * The moment that sells the product. While the orchestrator works, the
 * operator sees a phase-aware headline, a per-file feed that names every
 * file by its real status, and two escape hatches: cancel without ceremony
 * (POST /skip — in-flight Inngest waves complete naturally and rows already
 * landed stay landed), or continue to the calendar while the import finishes
 * in the background (POST /finalize, OnboardingProgressBanner takes over).
 */
export function MagicView({
  state,
  jobs,
  onCancel,
  onContinueInBackground,
  busyContinue,
  busyCancel,
}: MagicViewProps) {
  const reduceMotion = useReducedMotion();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const phase = PHASE_COPY[state.status] ?? PHASE_COPY.pending;
  const conciergeCount = jobs.filter((c) => c.status === 'needs_concierge').length;

  // Progress 0..1 — classified count drives the early phases; commit phase
  // counts how many children are no longer in flight. Stair-stepped by
  // design; the per-file feed below carries the live granularity.
  const progress = useMemo(() => {
    const total = state.file_count || jobs.length || 1;
    if (state.status === 'committing' || state.status === 'reviewing') {
      const done = jobs.filter((c) =>
        ['completed', 'partial_failure', 'failed', 'needs_concierge', 'cancelled'].includes(c.status),
      ).length;
      return Math.min(1, done / total);
    }
    return Math.min(1, (state.classified_count ?? 0) / total);
  }, [state, jobs]);

  // Continue-in-background is meaningful only once the import row is durable
  // on the server. While we're still receiving uploads, the user has nothing
  // to come back to.
  const canContinue =
    state.status !== 'uploading' && state.status !== 'pending';

  return (
    <motion.div
      key="magic"
      className="w-full max-w-2xl px-8 select-none"
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      <div className="text-center">
        <div className="h-10 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={phase.headline}
              className="text-2xl font-semibold text-foreground"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {phase.headline}
            </motion.h1>
          </AnimatePresence>
        </div>
        <div className="mx-auto mt-2 h-5 max-w-md overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={phase.subline}
              className="text-sm text-muted-foreground"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {phase.subline}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 h-[2px] overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full origin-left"
          style={{
            transformOrigin: 'left',
            background:
              'linear-gradient(90deg, var(--lume-accent), var(--lume-accent-muted, var(--lume-accent)))',
          }}
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        />
      </div>

      <div className="mt-8">
        <FileFeed jobs={jobs} />
      </div>

      {conciergeCount > 0 && (
        <motion.div
          className="mt-4 flex items-start gap-3 rounded-md bg-muted/40 px-4 py-3"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.2 }}
        >
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.25} />
          <div className="text-sm text-foreground">
            {conciergeCount === 1
              ? 'Il team Lume si occuperà di 1 file.'
              : `Il team Lume si occuperà di ${conciergeCount} file.`}
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ti scriviamo via email appena pronti. Non perdi niente.
            </p>
          </div>
        </motion.div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setConfirmingCancel(true)}
          disabled={busyCancel}
          className="text-sm text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        >
          Annulla importazione
        </button>
        <Button
          variant="secondary"
          onClick={onContinueInBackground}
          disabled={!canContinue || busyContinue}
        >
          {busyContinue ? 'Apro il calendario…' : 'Apri il calendario, continuo qui'}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        onConfirm={() => {
          setConfirmingCancel(false);
          onCancel();
        }}
        title="Annullo l'importazione?"
        description="Quello che ho già importato resta nel tuo salone. Le righe in coda non verranno aggiunte."
        confirmLabel="Sì, annulla"
        cancelLabel="Continua"
        tone="destructive"
      />
    </motion.div>
  );
}
