'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { useProductsStore } from '@/lib/stores/products';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Product } from '@/lib/types/Product';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
}

export function DeleteProductModal({ isOpen, onClose, selectedProduct }: DeleteProductModalProps) {
  const deleteProduct = useProductsStore((s) => s.deleteProduct);
  const archiveProduct = useProductsStore((s) => s.archiveProduct);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const [busy, setBusy] = useState(false);
  const isArchived = selectedProduct?.isArchived ?? false;

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setBusy(true);
    try {
      await deleteProduct(selectedProduct.id);
      await fetchProducts();
      messagePopup.getState().success('Prodotto eliminato.');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'eliminazione.";
      messagePopup.getState().error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedProduct) return;
    try {
      await archiveProduct(selectedProduct.id);
      messagePopup.getState().success('Prodotto archiviato con successo.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'archiviazione.");
    }
  };

  return (
    <DeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      busy={busy}
      title="Elimina prodotto"
      subtitle="Azione irreversibile: leggi con attenzione."
      confirmText="Elimina prodotto"
      confirmPhrase={selectedProduct?.name ?? ''}
      warning={
        <>
          <strong>Attenzione:</strong> eliminando il prodotto <strong>{selectedProduct?.name}</strong> verranno
          cancellati permanentemente il prodotto e <strong>tutte le righe ordine/fiche collegate</strong>. Questa
          operazione <strong>non potrà essere annullata</strong>.
        </>
      }
      tip={!isArchived && (
        <>
          <strong>Consiglio:</strong> usa <strong>Archivia</strong> per nascondere il prodotto mantenendo intatto lo
          storico dati.
        </>
      )}
      alternative={isArchived ? undefined : { label: 'Archivia', icon: Archive, onClick: handleArchive }}
    />
  );
}
