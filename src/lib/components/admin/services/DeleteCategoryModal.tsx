'use client';

import { useState } from 'react';
import { Archive } from 'lucide-react';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { ServiceCategory } from '@/lib/types/ServiceCategory';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ServiceCategory | null;
}

export function DeleteCategoryModal({ isOpen, onClose, category }: DeleteCategoryModalProps) {
  const deleteCategory = useServiceCategoriesStore((s) => s.deleteServiceCategory);
  const archiveCategory = useServiceCategoriesStore((s) => s.archiveServiceCategory);
  const fetchCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);
  const [busy, setBusy] = useState(false);
  const serviceCount = category?.service_count ?? 0;
  const isArchived = category?.isArchived ?? false;

  const handleDelete = async () => {
    if (!category) return;
    setBusy(true);
    try {
      await deleteCategory(category.id);
      await fetchCategories();
      messagePopup.getState().success('Categoria eliminata.');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
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
          permanentemente{' '}
          {serviceCount > 0 ? (
            <>
              tutti i{' '}
              <strong>
                {serviceCount} {serviceCount === 1 ? 'servizio collegato' : 'servizi collegati'}
              </strong>{' '}
              e, a cascata, <strong>tutte le schede e gli appuntamenti storici</strong> che li contengono.
            </>
          ) : (
            <>la categoria e tutti i dati ad essa associati.</>
          )}{' '}
          Questa operazione <strong>non potrà essere annullata</strong>.
        </>
      }
      tip={!isArchived && (
        <>
          <strong>Consiglio:</strong> usa <strong>Archivia</strong> per nascondere la categoria mantenendo intatto lo
          storico dati. Archiviando, anche i servizi collegati verranno archiviati.
        </>
      )}
      alternative={isArchived ? undefined : { label: 'Archivia', icon: Archive, onClick: handleArchive }}
    />
  );
}
