'use client';

import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Client } from '@/lib/types/Client';

interface DeleteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient: Client | null;
}

export function DeleteClientModal({ isOpen, onClose, selectedClient }: DeleteClientModalProps) {
  const deleteClient = useClientsStore((s) => s.deleteClient);

  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id);
      messagePopup.getState().success('Cliente eliminato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onClose={onClose}>
      <p>Sei sicuro di voler eliminare il cliente <strong>{selectedClient?.firstName} {selectedClient?.lastName}</strong>?</p>
    </DeleteModal>
  );
}
