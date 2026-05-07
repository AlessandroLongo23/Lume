'use client';

import { useState, useEffect } from 'react';
import { TriangleAlert, Trash2, X } from 'lucide-react';
import { Modal } from './Modal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Button } from '@/lib/components/shared/ui/Button';

const CONFIRM_PHRASE = 'ELIMINA TUTTO';

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityLabel: string;
  count: number;
  cascadeNotice?: React.ReactNode;
  onConfirm: () => Promise<void>;
}

export function DeleteAllModal({
  isOpen,
  onClose,
  entityLabel,
  count,
  cascadeNotice,
  onConfirm,
}: DeleteAllModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmInput.trim() === CONFIRM_PHRASE;

  useEffect(() => {
    if (isOpen) setConfirmInput('');
  }, [isOpen]);

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmInput('');
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
      messagePopup.getState().success(`Tutti i ${entityLabel.toLowerCase()} sono stati eliminati.`);
      setConfirmInput('');
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Errore durante l'eliminazione.";
      messagePopup.getState().error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} classes="max-w-lg" closeOnOutsideClick={false}>
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">

        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 min-w-0">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-red-500/10">
              <TriangleAlert className="size-5 text-red-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Elimina tutti i {entityLabel.toLowerCase()}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                Azione irreversibile — leggi attentamente
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="md"
            iconOnly
            aria-label="Chiudi"
            onClick={handleClose}
            disabled={isDeleting}
            className="shrink-0 ml-4"
          >
            <X />
          </Button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              <strong>Attenzione:</strong> stai per eliminare permanentemente{' '}
              <strong>{count} {entityLabel.toLowerCase()}</strong> e tutti i dati collegati.
              Questa operazione <strong>non potrà essere annullata in nessun modo</strong>.
            </p>
            {cascadeNotice && (
              <div className="mt-3 text-sm text-red-800 dark:text-red-300 leading-relaxed">
                {cascadeNotice}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Digita{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-medium">
                {CONFIRM_PHRASE}
              </strong>{' '}
              per confermare
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isConfirmed) handleDelete(); }}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              disabled={isDeleting}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        <div className="flex flex-row items-center justify-end gap-3 p-6 border-t border-zinc-500/25">
          <Button variant="secondary" leadingIcon={X} onClick={handleClose} disabled={isDeleting}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            leadingIcon={Trash2}
            disabled={!isConfirmed || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Eliminazione…' : `Elimina tutti (${count})`}
          </Button>
        </div>

      </div>
    </Modal>
  );
}
