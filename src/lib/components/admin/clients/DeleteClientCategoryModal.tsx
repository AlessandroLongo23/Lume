'use client';

import { useState, useEffect } from 'react';
import { TriangleAlert, Trash2, X } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { useClientCategoriesStore } from '@/lib/stores/client_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { ClientCategory } from '@/lib/types/ClientCategory';

interface DeleteClientCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: ClientCategory | null;
}

export function DeleteClientCategoryModal({ isOpen, onClose, category }: DeleteClientCategoryModalProps) {
  const deleteCategory = useClientCategoriesStore((s) => s.deleteClientCategory);
  const fetchCategories = useClientCategoriesStore((s) => s.fetchClientCategories);
  const [confirmInput, setConfirmInput] = useState('');

  const isConfirmed = confirmInput === category?.name;
  const clientCount = category?.client_count ?? 0;

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
          <button
            className="shrink-0 ml-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={handleClose}
            aria-label="Chiudi"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
              <strong>Attenzione:</strong> eliminando la categoria{' '}
              <strong>{category?.name}</strong>
              {clientCount > 0 ? (
                <>
                  {' '}{clientCount === 1 ? 'il cliente associato perderà' : `i ${clientCount} clienti associati perderanno`} il collegamento alla categoria.
                  I clienti <strong>non verranno eliminati</strong>.
                </>
              ) : (
                <> la categoria verrà rimossa definitivamente.</>
              )}{' '}
              Questa operazione <strong>non potrà essere annullata</strong>.
            </p>
          </div>

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
        <div className="flex flex-row items-center justify-end gap-3 p-6 border-t border-zinc-500/25">
          <button
            type="button"
            onClick={handleClose}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-zinc-900 dark:text-zinc-100"
          >
            <X className="size-4" />
            Annulla
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={handleDelete}
            className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-red-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-red-600"
          >
            <Trash2 className="size-4" />
            Elimina categoria
          </button>
        </div>

      </div>
    </Modal>
  );
}
