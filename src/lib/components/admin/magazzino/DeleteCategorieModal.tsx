'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { ProductCategory } from '@/lib/types/ProductCategory';

interface DeleteCategorieModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ProductCategory | null;
}

export function DeleteCategorieModal({ isOpen, onClose, category }: DeleteCategorieModalProps) {
  const deleteCategory = useProductCategoriesStore((s) => s.deleteProductCategory);
  const archiveCategory = useProductCategoriesStore((s) => s.archiveProductCategory);
  const [busy, setBusy] = useState(false);
  const isArchived = category?.isArchived ?? false;

  const handleDelete = async () => {
    if (!category) return;
    setBusy(true);
    try {
      await deleteCategory(category.id);
      messagePopup.getState().success('Categoria eliminata.');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'eliminazione.";
      messagePopup.getState().error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleArchive = async () => {
    if (!category) return;
    try {
      await archiveCategory(category.id);
      messagePopup.getState().success('Categoria archiviata con successo.');
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
      title="Elimina categoria"
      subtitle="Azione irreversibile: leggi con attenzione."
      confirmText="Elimina categoria"
      confirmPhrase={category?.name ?? ''}
      warning={
        <>
          <strong>Attenzione:</strong> eliminando la categoria <strong>{category?.name}</strong> verranno cancellati
          permanentemente la categoria e <strong>tutte le righe ordine/fiche collegate</strong>. Questa operazione{' '}
          <strong>non potrà essere annullata</strong>.
        </>
      }
      tip={!isArchived && (
        <>
          <strong>Consiglio:</strong> usa <strong>Archivia</strong> per nascondere la categoria mantenendo intatto lo
          storico dati. Archiviando, anche i prodotti collegati verranno archiviati.
        </>
      )}
      alternative={isArchived ? undefined : { label: 'Archivia', icon: Archive, onClick: handleArchive }}
    />
  );
}
