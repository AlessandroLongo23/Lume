'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { Sparkles } from 'lucide-react';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { TextLink } from '@/lib/components/shared/ui/TextLink';
import type { OnboardingState } from '@/lib/components/onboarding/onboardingTypes';

const ease = EASE_OUT;
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
 * Checks /api/onboarding/imports/active once on mount and whenever the tab
 * becomes visible again, then polls every 3s only while an import is in
 * flight and the tab is visible. Each check is a Vercel function call, and
 * polling idle tabs around the clock pushed the project past its CPU quota.
 * If the user is on /onboarding/import this component still renders, but the
 * page itself is full-screen so the banner is hidden behind it (acceptable;
 * mounting at the AppShell level covers the admin shell case).
 */
export function OnboardingProgressBanner() {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [hideAfterDone, setHideAfterDone] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let active = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function check() {
      timer = null;
      inFlight = true;
      try {
        const res = await fetch('/api/onboarding/imports/active', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (cancelled) return;
          active = json.onboarding != null;
          setState(json.onboarding ?? null);
        }
      } catch {
        // Silent: the banner is best-effort. A failed check keeps the last
        // known state, so an import in flight is retried on the next tick.
      } finally {
        inFlight = false;
      }
      if (!cancelled && active && document.visibilityState === 'visible') {
        timer = setTimeout(check, POLL_INTERVAL_MS);
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible' && !inFlight && timer === null) check();
    }

    check();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
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
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: DURATION.base, ease }}
          className="border-b border-line"
        >
          <Callout
            tone="info"
            icon={Sparkles}
            className="rounded-none items-center gap-x-2.5 py-0 px-4 min-h-9 [&>svg]:mt-0 [&>svg]:size-3.5"
            action={state.status === 'reviewing' ? (
              <TextLink href="/onboarding/import" className="inline-flex items-center min-h-9 pointer-coarse:min-h-11">
                Continua
              </TextLink>
            ) : undefined}
          >
            <p className="truncate text-[var(--lume-text)]">
              {STATUS_LABEL[state.status]}
              {state.committed_count > 0 && (
                <span className="text-[var(--lume-text-secondary)] tabular-nums">
                  {' '}· {state.committed_count.toLocaleString('it-IT')} record
                </span>
              )}
            </p>
          </Callout>
          <div className="h-0.5 bg-line overflow-hidden">
            <motion.div
              className="h-full bg-info-strong origin-left"
              animate={{ scaleX: progress }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease }}
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
