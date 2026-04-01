'use client';

import { useState } from 'react';
import { Tags, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const addCategory = useServiceCategoriesStore((s) => s.addServiceCategory);
  const updateCategory = useServiceCategoriesStore((s) => s.updateServiceCategory);
  const deleteCategory = useServiceCategoriesStore((s) => s.deleteServiceCategory);
  const fetchCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);

  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await addCategory({ name });
      await fetchCategories();
      setNewName('');
      messagePopup.getState().success('Categoria aggiunta.');
    } catch {
      messagePopup.getState().error('Errore durante la creazione della categoria.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || !editing.name.trim()) return;
    try {
      await updateCategory(editing.id, { name: editing.name.trim() });
      await fetchCategories();
      setEditing(null);
      messagePopup.getState().success('Categoria aggiornata.');
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      await fetchCategories();
      setDeletingId(null);
      messagePopup.getState().success('Categoria eliminata.');
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  const rowBase = 'flex flex-row items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-900';

  return (
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-md">
      <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full max-h-[90vh]">

        <div className="flex flex-row items-center justify-between p-6 border-b border-zinc-500/25 shrink-0">
          <div className="flex flex-row items-center gap-3">
            <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-indigo-500/10">
              <Tags className="size-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Gestisci Categorie</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {categories.length} {categories.length === 1 ? 'categoria' : 'categorie'}
              </p>
            </div>
          </div>
          <button
            aria-label="Chiudi"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-6 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">
              Nessuna categoria. Creane una qui sotto.
            </p>
          ) : (
            categories.map((cat) => {
              if (editing?.id === cat.id) {
                return (
                  <div key={cat.id} className={rowBase}>
                    <input
                      className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none border-b border-indigo-500 pb-0.5"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setEditing(null);
                      }}
                      autoFocus
                    />
                    <div className="flex flex-row gap-1 shrink-0">
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 transition-colors"
                        aria-label="Salva"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                        aria-label="Annulla"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              if (deletingId === cat.id) {
                return (
                  <div key={cat.id} className={`${rowBase} border-red-500/30`}>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                      Eliminare <strong>{cat.name}</strong>?
                    </span>
                    <div className="flex flex-row gap-1 shrink-0">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white transition-colors"
                      >
                        Elimina
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={cat.id} className={rowBase}>
                  <span className="text-sm text-zinc-900 dark:text-zinc-100 flex-1 truncate">{cat.name}</span>
                  <div className="flex flex-row gap-1 shrink-0">
                    <button
                      onClick={() => setEditing({ id: cat.id, name: cat.name })}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      aria-label="Modifica"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 transition-colors"
                      aria-label="Elimina"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-row items-center gap-3 p-6 border-t border-zinc-500/25 shrink-0">
          <input
            className="flex-1 p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Nuova categoria..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="flex flex-row items-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-40 disabled:pointer-events-none transition-all shrink-0"
          >
            <Plus className="size-4" />
            Aggiungi
          </button>
        </div>
      </div>
    </Modal>
  );
}
