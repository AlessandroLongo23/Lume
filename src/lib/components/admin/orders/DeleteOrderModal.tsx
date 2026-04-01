'use client';

import { useOrdersStore } from '@/lib/stores/orders';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Order } from '@/lib/types/Order';

interface DeleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: Order | null;
}

export function DeleteOrderModal({ isOpen, onClose, selectedOrder }: DeleteOrderModalProps) {
  const deleteOrder = useOrdersStore((s) => s.deleteOrder);

  const handleDelete = async () => {
    if (!selectedOrder) return;
    try {
      await deleteOrder(selectedOrder.id);
      messagePopup.getState().success('Ordine eliminato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onClose={onClose}>
      <p>Sei sicuro di voler eliminare l&apos;ordine <strong>{selectedOrder?.id}</strong>?</p>
    </DeleteModal>
  );
}
