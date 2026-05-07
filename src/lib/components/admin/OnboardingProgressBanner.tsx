'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { OnboardingState } from '@/lib/components/onboarding/onboardingTypes';

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const POLL_INTERVAL_MS = 3000;

const STATUS_LABEL: Record<OnboardingState['status'], string> = {
  pending:         'Importazione in coda…',
  uploading:       'Caricamento file…',
  classifying:     'Sto leggendo i tuoi file…',
  mapping:         'Sto mappando le colonne…',
  reviewing:       'Alcuni file richiedono la tua occhiata',
  committing:      'Importazione in corso…',
  completed:       'Importazione completata',
  partial_failure: 'Importazione completata',
  skipped:         '',
  failed:          'Importazione interrotta',
};

/**
 * Thin top progress bar mounted in the admin shell. Visible whenever an
 * onboarding bulk-import is mid-flight; auto-fades 5s after completion.
 *
 * Polls /api/onboarding/imports/active every 3s — cheap, the row is small.
 * If the user is on /onboarding/import this component still renders, but the
 * page itself is full-screen so the banner is hidden behind it (acceptable;
 * mounting at the AppShell level covers the admin shell case).
 */
export function OnboardingProgressBanner() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [hideAfterDone, setHideAfterDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch('/api/onboarding/imports/active', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setState(json.onboarding ?? null);
      } catch {
        // Silent — banner is best-effort. Will retry on next interval.
      }
    }

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Auto-fade 5s after the run reaches a successful terminal state. Reset
  // is also done via a deferred callback (setTimeout(0)) so we never call
  // setState synchronously inside the effect body.
  const isCurrentlyDone = state?.status === 'completed' || state?.status === 'partial_failure';
  useEffect(() => {
    if (isCurrentlyDone) {
      const t = setTimeout(() => setHideAfterDone(true), 5000);
      return () => clearTimeout(t);
    }
    const reset = setTimeout(() => setHideAfterDone(false), 0);
    return () => clearTimeout(reset);
  }, [isCurrentlyDone]);

  const visible = state && !hideAfterDone && state.status !== 'skipped';

  // Progress 0..1: classified_count covers the classification phase; once we
  // have a summary, count rows committed against an estimated total. This is
  // a UX nudge, not exact — under-promise is fine.
  const progress = (() => {
    if (!state) return 0;
    if (state.status === 'classifying' || state.status === 'mapping') {
      return state.file_count > 0 ? state.classified_count / state.file_count : 0;
    }
    if (state.status === 'committing' || state.status === 'reviewing') {
      const total = sumValues(state.summary_json) || state.committed_count;
      if (total <= 0) return 0.5;
      return Math.min(1, state.committed_count / total);
    }
    if (state.status === 'completed' || state.status === 'partial_failure') return 1;
    return 0;
  })();

  return (
    <AnimatePresence>
      {visible && state && (
        <motion.div
          key="onboarding-banner"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.4, ease }}
          className="border-b border-border bg-card"
        >
          <div className="flex items-center gap-3 px-4 py-2">
            <Sparkles className="size-3.5 text-primary shrink-0" strokeWidth={2.25} />
            <span className="text-xs font-light text-foreground truncate">
              {STATUS_LABEL[state.status]}
            </span>
            {state.committed_count > 0 && (
              <span className="text-xs font-light text-muted-foreground tabular-nums">
                · {state.committed_count.toLocaleString('it-IT')} record
              </span>
            )}
            {state.status === 'reviewing' && (
              <Link
                href="/onboarding/import"
                className="ml-auto text-xs font-light text-primary hover:underline"
              >
                Continua
              </Link>
            )}
            <div className="flex-1" />
          </div>
          <div className="h-px bg-border overflow-hidden">
            <motion.div
              className="h-full bg-primary origin-left"
              animate={{ scaleX: progress }}
              transition={{ duration: 0.5, ease }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function sumValues(summary: OnboardingState['summary_json']): number {
  if (!summary) return 0;
  let total = 0;
  for (const [k, v] of Object.entries(summary)) {
    if (k === 'unclassifiedFiles') continue;
    if (typeof v === 'number') total += v;
  }
  return total;
}
