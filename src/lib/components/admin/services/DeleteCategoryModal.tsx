'use client';

import { useState, useEffect } from 'react';
import { TriangleAlert, Trash2, X, Archive } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { Button } from '@/lib/components/shared/ui/Button';
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
  const [confirmInput, setConfirmInput] = useState('');

  const isConfirmed = confirmInput === category?.name;
  const serviceCount = category?.service_count ?? 0;
  const isArchived = category?.isArchived ?? false;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setConfirmInput('');
  }, [isOpen]);

  const handleClose = () => {
    setConfirmInput('');
    onClose();
  };

  const handleDelete = async () => {
    if (!category || !isConfirmed) return;
    try {
      await deleteCategory(category.id);
      await fetchCategories();
      messagePopup.getState().success('Categoria eliminata.');
      handleClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  const handleArchive = async () => {
    if (!category) return;
    try {
      await archiveCategory(category.id);
      messagePopup.getState().success('Categoria archiviata con successo.');
      handleClose();
    } catch {
      messagePopup.getState().error("Errore durante l'archiviazione.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} classes="max-w-lg" closeOnOutsideClick={false}>
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">

        {/* Header */}
        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25">
          <div className="flex flex-row items-center gap-3 min-w-0">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-red-500/10">
              <TriangleAlert className="size-5 text-red-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Elimina categoria</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Azione irreversibile — leggi attentamente</p>
            </div>
          </div>
          <Button variant="ghost" size="md" iconOnly aria-label="Chiudi" onClick={handleClose} className="shrink-0 ml-4">
            <X />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              <strong>Attenzione:</strong> eliminando la categoria{' '}
              <strong>{category?.name}</strong> verranno cancellati permanentemente{' '}
              {serviceCount > 0 ? (
                <>
                  tutti i{' '}
                  <strong>
                    {serviceCount} {serviceCount === 1 ? 'servizio collegato' : 'servizi collegati'}
                  </strong>{' '}
                  e, a cascata,{' '}
                  <strong>tutte le schede e gli appuntamenti storici</strong> che li contengono.
                </>
              ) : (
                <>la categoria e tutti i dati ad essa associati.</>
              )}{' '}
              Questa operazione <strong>non potrà essere annullata</strong>.
            </p>
          </div>

          {!isArchived && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Consiglio:</strong> usa <strong>Archivia</strong> per nascondere la categoria
                mantenendo intatto lo storico dati. Archiviando, anche i servizi collegati verranno archiviati.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">
              Digita{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-medium">
                {category?.name}
              </strong>{' '}
              per confermare
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && isConfirmed) handleDelete(); }}
              placeholder={category?.name ?? ''}
              autoComplete="off"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-row items-center justify-between gap-3 p-6 border-t border-zinc-500/25">
          <div>
            {!isArchived && (
              <Button
                variant="ghost"
                leadingIcon={Archive}
                onClick={handleArchive}
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              >
                Archivia
              </Button>
            )}
          </div>
          <div className="flex flex-row items-center gap-3">
            <Button variant="secondary" leadingIcon={X} onClick={handleClose}>
              Annulla
            </Button>
            <Button variant="destructive" leadingIcon={Trash2} disabled={!isConfirmed} onClick={handleDelete}>
              Elimina categoria
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
