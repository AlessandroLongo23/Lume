'use client';

import { useState, useEffect } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import type { ProductCategory } from '@/lib/types/ProductCategory';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: ProductCategory | null;
}

const emptyForm = () => ({ name: '', description: '' });

export function AddCategoryModal({ isOpen, onClose, selectedCategory }: AddCategoryModalProps) {
  const addProductCategory = useProductCategoriesStore((s) => s.addProductCategory);
  const updateProductCategory = useProductCategoriesStore((s) => s.updateProductCategory);
  const archiveProductCategory = useProductCategoriesStore((s) => s.archiveProductCategory);
  const restoreProductCategory = useProductCategoriesStore((s) => s.restoreProductCategory);
  const fetchProductCategories = useProductCategoriesStore((s) => s.fetchProductCategories);
  const [form, setForm] = useState(emptyForm());
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (selectedCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: selectedCategory.name, description: selectedCategory.description ?? '' });
    } else {
      setForm(emptyForm());
    }
    setNameError('');
  }, [selectedCategory, isOpen]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setNameError('Il nome è obbligatorio.'); return; }
    setNameError('');
    try {
      if (selectedCategory) {
        await updateProductCategory(selectedCategory.id, { name: form.name.trim(), description: form.description.trim() });
        messagePopup.getState().success('Categoria aggiornata.');
      } else {
        await addProductCategory({ name: form.name.trim(), description: form.description.trim() });
        messagePopup.getState().success('Categoria aggiunta.');
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedCategory) return;
    try {
      if (selectedCategory.isArchived) {
        await restoreProductCategory(selectedCategory.id);
        messagePopup.getState().success('Categoria ripristinata.');
      } else {
        await archiveProductCategory(selectedCategory.id);
        messagePopup.getState().success('Categoria archiviata.');
      }
      await fetchProductCategories();
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={selectedCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
      subtitle="Categoria per i prodotti del magazzino"
      confirmText={selectedCategory ? 'Aggiorna' : 'Aggiungi'}
      classes="max-w-sm"
      footerContent={
        selectedCategory && (
          <Button
            variant="ghost"
            leadingIcon={selectedCategory.isArchived ? ArchiveRestore : Archive}
            onClick={handleToggleArchive}
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
          >
            {selectedCategory.isArchived ? 'Ripristina' : 'Archivia'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="es. Coloranti, Shampoo..."
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrizione</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass}
            placeholder="Descrizione opzionale"
          />
        </div>
      </div>
    </AddModal>
  );
}
