'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';
import type { CancellationReason } from '@/lib/types/Subscription';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

const REASONS: { value: CancellationReason; label: string }[] = [
  { value: 'too_expensive',    label: 'Troppo costoso' },
  { value: 'missing_features', label: 'Mi mancano funzionalità' },
  { value: 'switched_tool',    label: 'Sono passato a un altro strumento' },
  { value: 'closing_salon',    label: 'Chiudo il salone' },
  { value: 'other',            label: 'Altro' },
];

const formatRenewalDate = (iso: string | null): string | null => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

export function CancelSubscriptionModal({ isOpen, onClose }: Props) {
  const subscriptionEndsAt = useSubscriptionStore((s) => s.subscriptionEndsAt);
  const cancel = useSubscriptionStore((s) => s.cancel);

  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Form state lives inside an inner component keyed by `isOpen` so each
  // open is a fresh mount — avoids reset-in-effect lint and is also faster
  // (no re-render of the chip list when closing).
  return createPortal(
    <CancelDialogShell
      key={isOpen ? 'open' : 'closed'}
      isOpen={isOpen}
      onClose={onClose}
      cancel={cancel}
      subscriptionEndsAt={subscriptionEndsAt}
      reduceMotion={reduceMotion ?? false}
    />,
    document.body,
  );
}

interface ShellProps {
  isOpen: boolean;
  onClose: () => void;
  cancel: ReturnType<typeof useSubscriptionStore.getState>['cancel'];
  subscriptionEndsAt: string | null;
  reduceMotion: boolean;
}

function CancelDialogShell({ isOpen, onClose, cancel, subscriptionEndsAt, reduceMotion }: ShellProps) {
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    const result = await cancel(reason, comment.trim() || null);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? 'Errore durante l\'annullamento.');
      setSubmitting(false);
    }
  };

  const renewalDate = formatRenewalDate(subscriptionEndsAt);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/30 z-modal-backdrop flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            className="w-full max-w-md bg-card rounded-lg shadow-xl ring-1 ring-border overflow-hidden"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col gap-5 px-6 pt-6 pb-5">
              <div className="flex flex-col gap-2">
                <h2 id="cancel-title" className="text-2xl font-semibold tracking-tight text-foreground">
                  Annullare l&apos;abbonamento?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {renewalDate
                    ? <>Continuerai ad avere accesso fino al <strong className="text-primary font-semibold">{renewalDate}</strong>. Puoi riattivare l&apos;abbonamento prima di quella data senza perdere nulla.</>
                    : <>Continuerai ad avere accesso fino alla fine del periodo già pagato. Puoi riattivare l&apos;abbonamento prima senza perdere nulla.</>}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Perché annulli? (facoltativo)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {REASONS.map((r) => {
                    const selected = reason === r.value;
                    return (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setReason(selected ? null : r.value)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card ${
                          selected
                            ? 'bg-accent-soft text-primary'
                            : 'bg-muted text-foreground hover:bg-muted/70'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cosa potremmo migliorare? (facoltativo)"
                rows={3}
                maxLength={1000}
                className="w-full text-sm text-foreground bg-background border border-border rounded-md px-3 py-2 resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring focus:ring-inset"
              />

              {error && (
                <div role="alert" className="flex items-start gap-2 text-sm text-danger-strong bg-danger-soft border border-danger-line rounded-md px-3 py-2">
                  <CircleAlert className="size-4 mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Mantieni l&apos;abbonamento
              </Button>
              <Button variant="secondary" size="sm" onClick={handleConfirm} loading={submitting}>
                Annulla l&apos;abbonamento
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
