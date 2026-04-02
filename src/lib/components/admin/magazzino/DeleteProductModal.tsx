'use client';

import { Trash2 } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductsStore } from '@/lib/stores/products';
import type { Product } from '@/lib/types/Product';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
}

export function DeleteProductModal({ isOpen, onClose, selectedProduct }: DeleteProductModalProps) {
  const deleteProduct = useProductsStore((s) => s.deleteProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id);
      await fetchProducts();
      messagePopup.getState().success('Prodotto eliminato.');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleDelete}
      title="Elimina Prodotto"
      subtitle={selectedProduct ? `Stai eliminando: ${selectedProduct.name}` : ''}
      confirmText="Elimina"
      classes="max-w-sm"
      dangerAction={
        <div className="flex items-center gap-2 text-sm text-red-500">
          <Trash2 className="size-4" />
          <span>Azione irreversibile</span>
        </div>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sei sicuro di voler eliminare <strong className="text-zinc-900 dark:text-zinc-100">{selectedProduct?.name}</strong>?
        Questa azione non può essere annullata.
      </p>
    </AddModal>
  );
}
