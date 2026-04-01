'use client';

import { useProductsStore } from '@/lib/stores/products';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Product } from '@/lib/types/Product';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
}

export function DeleteProductModal({ isOpen, onClose, selectedProduct }: DeleteProductModalProps) {
  const deleteProduct = useProductsStore((s) => s.deleteProduct);

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      messagePopup.getState().success('Prodotto eliminato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onClose={onClose}>
      <p>Sei sicuro di voler eliminare il prodotto <strong>{selectedProduct?.name}</strong>?</p>
    </DeleteModal>
  );
}
