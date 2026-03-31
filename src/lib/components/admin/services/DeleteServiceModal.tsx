'use client';

import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Service } from '@/lib/types/Service';

interface DeleteServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: Service | null;
}

export function DeleteServiceModal({ isOpen, onClose, selectedService }: DeleteServiceModalProps) {
  const deleteService = useServicesStore((s) => s.deleteService);

  const handleDelete = async () => {
    if (!selectedService) return;
    try {
      await deleteService(selectedService.id);
      messagePopup.getState().success('Servizio eliminato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onCancel={onClose} onClose={onClose}>
      <p>Sei sicuro di voler eliminare il servizio <strong>{selectedService?.name}</strong>?</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Questa azione è irreversibile.</p>
    </DeleteModal>
  );
}
