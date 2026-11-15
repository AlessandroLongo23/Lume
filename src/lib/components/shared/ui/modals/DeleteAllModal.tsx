'use client';

import { useState } from 'react';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from './DeleteModal';

const CONFIRM_PHRASE_BY_MODE = {
  all: 'ELIMINA TUTTO',
  selected: 'ELIMINA',
} as const;

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityLabel: string;
  count: number;
  cascadeNotice?: React.ReactNode;
  onConfirm: () => Promise<void>;
  mode?: 'all' | 'selected';
}

/**
 * The bulk delete of a whole table or of the selected rows: a DeleteModal
 * with a type-to-confirm phrase that runs the delete itself and reports the
 * outcome with a toast.
 */
export function DeleteAllModal({
  isOpen,
  onClose,
  entityLabel,
  count,
  cascadeNotice,
  onConfirm,
  mode = 'all',
}: DeleteAllModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const label = entityLabel.toLowerCase();
  const title = mode === 'all'
    ? `Elimina tutti i ${label}`
    : `Elimina ${count} ${label}`;
  const submitLabel = mode === 'all'
    ? `Elimina tutti (${count})`
    : `Elimina (${count})`;
  const successMessage = mode === 'all'
    ? `Tutti i ${label} sono stati eliminati.`
    : `${count} ${label} eliminati.`;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      messagePopup.getState().success(successMessage);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Errore durante l'eliminazione.";
      messagePopup.getState().error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title={title}
      subtitle="Azione irreversibile: leggi con attenzione."
      warning={
        <div className="flex flex-col gap-2">
          <p>
            Stai per eliminare definitivamente{' '}
            <span className="font-medium">{count} {label}</span> e tutti i dati collegati.
            Questa operazione non potrà essere annullata in nessun modo.
          </p>
          {cascadeNotice && <div>{cascadeNotice}</div>}
        </div>
      }
      confirmPhrase={CONFIRM_PHRASE_BY_MODE[mode]}
      confirmText={isDeleting ? 'Eliminazione…' : submitLabel}
      busy={isDeleting}
    />
  );
}
