'use client';

import { useFichesStore } from '@/lib/stores/fiches';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Fiche } from '@/lib/types/Fiche';

interface DeleteFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiche: Fiche | null;
}

export function DeleteFicheModal({ isOpen, onClose, selectedFiche }: DeleteFicheModalProps) {
  const deleteFiche = useFichesStore((s) => s.deleteFiche);

  const handleDelete = async () => {
    if (!selectedFiche) return;
    try {
      await deleteFiche(selectedFiche.id);
      messagePopup.getState().success('Fiche eliminata con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onCancel={onClose} onClose={onClose}>
      <p>Sei sicuro di voler eliminare la fiche <strong>{selectedFiche?.id}</strong>?</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Questa azione è irreversibile.</p>
    </DeleteModal>
  );
}
