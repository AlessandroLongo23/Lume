'use client';

import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';

interface ConfirmEditClosedFicheDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the typed reason (or undefined if blank) on confirm. */
  onConfirm: (reason: string | undefined) => void;
  isSubmitting?: boolean;
}

/** Inner shell — kept as a separate component so we can force a fresh mount
 *  per open via `key={isOpen ? 'open' : 'closed'}` from the wrapper. That
 *  resets the textarea between openings without an effect, which keeps us
 *  out of `react-hooks/set-state-in-effect` and ESLint-error territory. */
function ConfirmEditClosedFicheDialogInner({
  onClose,
  onConfirm,
  isSubmitting,
}: Omit<ConfirmEditClosedFicheDialogProps, 'isOpen'> & { isSubmitting: boolean }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const trimmed = reason.trim();
    onConfirm(trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <div className="flex flex-col bg-muted rounded-lg shadow-xl w-full">
        <div className="flex flex-row items-center justify-between p-5 border-b border-zinc-500/25 shrink-0">
          <div className="flex flex-row items-center gap-3 truncate">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-[var(--lume-warning-bg)]">
              <Pencil className="size-5 text-[var(--lume-warning-fg)]" />
            </div>
            <div className="flex flex-col truncate">
              <h2 className="text-base font-semibold text-foreground">Modifica fiche chiusa</h2>
              <p className="text-xs text-muted-foreground truncate">
                Le modifiche saranno tracciate nella cronologia
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="md"
            iconOnly
            aria-label="Chiudi"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X />
          </Button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Stai modificando una fiche già pagata. Le modifiche saranno tracciate nella cronologia.
          </p>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm-edit-reason"
              className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide"
            >
              Motivo della modifica (opzionale)
            </label>
            <textarea
              id="confirm-edit-reason"
              className="w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50 focus:border-primary/50 transition-shadow resize-none"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Es. Cliente ha aggiunto shampoo dimenticato"
              maxLength={500}
              autoFocus
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="flex flex-row items-center justify-end gap-2 p-4 border-t border-zinc-500/25 bg-zinc-50/60 dark:bg-zinc-950/40 rounded-b-lg">
          <Button variant="secondary" leadingIcon={X} onClick={onClose} disabled={isSubmitting}>
            Annulla
          </Button>
          <Button
            variant="primary"
            leadingIcon={Check}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvataggio…' : 'Conferma modifica'}
          </Button>
        </div>
      </div>
  );
}

export function ConfirmEditClosedFicheDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ConfirmEditClosedFicheDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classes="max-w-md"
      backgroundBlur="xs"
      closeOnOutsideClick={!isSubmitting}
    >
      {/* Re-mount the inner shell each time the dialog opens so the textarea
          state resets without an effect. */}
      <ConfirmEditClosedFicheDialogInner
        key={isOpen ? 'open' : 'closed'}
        onClose={onClose}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}
