'use client';

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

  const handleDelete = async () => {
    if (!selectedOperator) return;
    try {
      await deleteOperator(selectedOperator.id);
      messagePopup.getState().success('Operatore eliminato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onCancel={onClose} onClose={onClose}>
      <p>Sei sicuro di voler eliminare l&apos;operatore <strong>{selectedOperator?.firstName} {selectedOperator?.lastName}</strong>?</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Questa azione è irreversibile.</p>
    </DeleteModal>
  );
}
