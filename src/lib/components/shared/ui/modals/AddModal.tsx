'use client';

import { useId } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/lib/components/shared/ui/Button';
import { DialogFooter, DialogHeader } from './dialogParts';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  dangerAction?: React.ReactNode;
  /** Width of the dialog (`max-w-*`). */
  classes?: string;
  /** "Aggiungi" by default; edit dialogs pass "Salva". */
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  /** Optional `data-tour` value forwarded to the confirm button, so interactive
   *  guides can anchor a "save" step to it (e.g. `save-client`). */
  confirmDataTour?: string;
  /** When true, the primary "confirm" button is omitted from the footer.
   *  Useful for read-only views (e.g. an audit log tab) where the modal acts
   *  as a viewer and there is no save action. */
  hideConfirm?: boolean;
  /** When true, the "cancel" button is omitted from the footer. Useful when
   *  the dangerAction slot already exposes a clear retreat path and a second
   *  cancel-style action would be ambiguous. */
  hideCancel?: boolean;
  /** Forwarded to Modal. Default true; pass false for stacked modals so the
   *  dimmed area click doesn't cascade to the modal behind. */
  closeOnOutsideClick?: boolean;
  /** Forwarded to Modal: fires once the open animation finishes. Used by
   *  interactive guides to advance an "open the modal" step only after the modal
   *  has settled, so the next step's coachmark anchors on the final element rect. */
  onEnterComplete?: () => void;
}

export function AddModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  children,
  footerContent,
  dangerAction,
  classes = '',
  confirmText = 'Aggiungi',
  cancelText = 'Annulla',
  confirmDisabled = false,
  confirmDataTour,
  hideConfirm = false,
  hideCancel = false,
  closeOnOutsideClick = true,
  onEnterComplete,
}: AddModalProps) {
  const titleId = useId();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classes={classes}
      closeOnOutsideClick={closeOnOutsideClick}
      onEnterComplete={onEnterComplete}
      labelledBy={titleId}
    >
      <DialogHeader titleId={titleId} title={title} subtitle={subtitle} onClose={onClose} divider />

      <div className="p-6 flex-1 min-h-0 overflow-y-auto">{children}</div>

      <DialogFooter start={footerContent}>
        {dangerAction}
        {!hideCancel && (
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
        )}
        {!hideConfirm && (
          <Button
            variant="primary"
            leadingIcon={Check}
            disabled={confirmDisabled}
            onClick={onSubmit}
            data-tour={confirmDataTour}
          >
            {confirmText}
          </Button>
        )}
      </DialogFooter>
    </Modal>
  );
}
