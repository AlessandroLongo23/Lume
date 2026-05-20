'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { GraduationCap, ListChecks } from 'lucide-react';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { Button } from '@/lib/components/shared/ui/Button';

interface TourWelcomeProps {
  open: boolean;
  title: string;
  body: string;
  onStart: () => void;
  onDismiss: () => void;
  startLabel?: string;
  dismissLabel?: string;
  /** Prerequisite tutorials that will be run first ("Per questa guida prepariamo prima: …"). */
  steps?: string[];
  /** Prerequisites with no tutorial yet — listed as a muted note (optional link). */
  missing?: { label: string; href?: string }[];
}

/**
 * Centred welcome splash shown before an interactive tour. It lives in its own
 * portal layer and cross-fades: on "Inizia" it fades out while the tour's first
 * (anchored) spotlight + coachmark fade in — avoiding NextStep's centred-card
 * position snap while keeping the welcome perfectly centred.
 */
export function TourWelcome({
  open,
  title,
  body,
  onStart,
  onDismiss,
  startLabel = 'Inizia il giro',
  dismissLabel = 'Più tardi',
  steps,
  missing,
}: TourWelcomeProps) {
  const reduce = useReducedMotion();
  const hasSteps = (steps?.length ?? 0) > 0;
  const hasMissing = (missing?.length ?? 0) > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-modal-backdrop flex items-center justify-center bg-black/20 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onDismiss}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="relative w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <GraduationCap className="size-5 text-primary" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>

              {hasSteps && (
                <div className="mt-4 rounded-lg bg-primary/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <ListChecks className="size-3.5 text-primary" />
                    Per questa guida prepariamo prima:
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 pl-5 text-sm text-muted-foreground">
                    {steps!.map((s) => (
                      <li key={s} className="list-disc">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasMissing && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Ti servirà anche:{' '}
                  {missing!.map((m, i) => (
                    <span key={m.label}>
                      {i > 0 && ', '}
                      {m.href ? (
                        <a href={m.href} className="text-primary underline-offset-2 hover:underline">
                          {m.label}
                        </a>
                      ) : (
                        m.label
                      )}
                    </span>
                  ))}
                  .
                </p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onDismiss}>
                  {dismissLabel}
                </Button>
                <Button variant="primary" size="sm" onClick={onStart}>
                  {startLabel}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
