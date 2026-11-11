'use client';

import { useId, useState } from 'react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { DialogFooter, DialogHeader } from '@/lib/components/shared/ui/modals/dialogParts';

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
  titleId,
  onClose,
  onConfirm,
  isSubmitting,
}: Omit<ConfirmEditClosedFicheDialogProps, 'isOpen'> & { titleId: string; isSubmitting: boolean }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const trimmed = reason.trim();
    onConfirm(trimmed.length > 0 ? trimmed : undefined);
  };

  return (
    <>
      <DialogHeader
        title="Modifica fiche chiusa"
        titleId={titleId}
        subtitle="Stai modificando una fiche già pagata. Le modifiche saranno tracciate nella cronologia."
        onClose={onClose}
        closeDisabled={isSubmitting}
      />
      <div className="px-6 pt-2 pb-5">
        <TextArea
          label="Motivo della modifica (opzionale)"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Es. Cliente ha aggiunto shampoo dimenticato"
          maxLength={500}
          autoFocus
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Annulla
        </Button>
        <Button variant="primary" onClick={handleConfirm} loading={isSubmitting}>
          Conferma modifica
        </Button>
      </DialogFooter>
    </>
  );
}

export function ConfirmEditClosedFicheDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ConfirmEditClosedFicheDialogProps) {
  const titleId = useId();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classes="max-w-md"
      closeOnOutsideClick={!isSubmitting}
      labelledBy={titleId}
    >
      {/* Re-mount the inner shell each time the dialog opens so the textarea
          state resets without an effect. */}
      <ConfirmEditClosedFicheDialogInner
        key={isOpen ? 'open' : 'closed'}
        titleId={titleId}
        onClose={onClose}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
      />
    </Modal>
  );
}
