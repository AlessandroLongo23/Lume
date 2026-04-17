'use client';

import { useFichesStore } from '@/lib/stores/fiches';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Fiche } from '@/lib/types/Fiche';
import { formatDateDisplay, formatTime } from '@/lib/utils/format';

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

  const clientName = selectedFiche?.getClient()?.getFullName();
  const date = selectedFiche ? formatDateDisplay(selectedFiche.datetime, 'd MMMM yyyy') : '';
  const time = selectedFiche ? formatTime(new Date(selectedFiche.datetime).toISOString()) : '';

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onClose={onClose}>
      <p>
        Sei sicuro di voler eliminare la fiche
        {clientName ? <> di <strong>{clientName}</strong></> : null}
        {date ? <> del <strong>{date}</strong></> : null}
        {time ? <> alle <strong>{time}</strong></> : null}?
      </p>
    </DeleteModal>
  );
}
