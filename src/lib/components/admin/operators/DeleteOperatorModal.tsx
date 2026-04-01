'use client';

import { Archive } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Operator } from '@/lib/types/Operator';

interface DeleteOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOperator: Operator | null;
}

export function DeleteOperatorModal({ isOpen, onClose, selectedOperator }: DeleteOperatorModalProps) {
  const deleteOperator = useOperatorsStore((s) => s.deleteOperator);
  const archiveOperator = useOperatorsStore((s) => s.archiveOperator);

  const handleDelete = async () => {
    if (!selectedOperator) return;
    try {
      await deleteOperator(selectedOperator.id);
      messagePopup.getState().success('Operatore eliminato definitivamente.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  const handleArchive = async () => {
    if (!selectedOperator) return;
    try {
      await archiveOperator(selectedOperator.id);
      messagePopup.getState().success('Operatore archiviato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'archiviazione.");
    }
  };

  const isArchived = selectedOperator?.archived_at !== null;

  return (
    <DeleteModal
      isOpen={isOpen}
      onConfirm={handleDelete}
      onClose={onClose}
      title="Elimina operatore"
      subtitle="Attenzione: azione distruttiva"
      classes="max-w-lg"
      footerContent={
        !isArchived ? (
          <button
            type="button"
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            onClick={handleArchive}
          >
            <Archive className="size-4" />
            Archivia invece
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {selectedOperator?.firstName} {selectedOperator?.lastName}
        </p>

        <div className="flex flex-col gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Eliminazione permanente</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tutti i dati collegati a questo operatore verranno eliminati definitivamente: appuntamenti, fiches, storico presenze e statistiche. Questa azione non può essere annullata.
          </p>
        </div>

        {!isArchived && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Consiglio: usa <strong>Archivia invece</strong> per nascondere l&apos;operatore mantenendo intatto lo storico dati.
          </p>
        )}
      </div>
    </DeleteModal>
  );
}
