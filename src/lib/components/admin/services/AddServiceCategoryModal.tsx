'use client';

import { useState, useEffect } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { CATEGORY_PICKER_COLORS, DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import type { ServiceCategory } from '@/lib/types/ServiceCategory';

interface AddServiceCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: ServiceCategory | null;
}

const emptyForm = () => ({ name: '', description: '', color: DEFAULT_CATEGORY_COLOR });

export function AddServiceCategoryModal({ isOpen, onClose, selectedCategory }: AddServiceCategoryModalProps) {
  const addCategory = useServiceCategoriesStore((s) => s.addServiceCategory);
  const updateCategory = useServiceCategoriesStore((s) => s.updateServiceCategory);
  const archiveCategory = useServiceCategoriesStore((s) => s.archiveServiceCategory);
  const restoreCategory = useServiceCategoriesStore((s) => s.restoreServiceCategory);
  const fetchCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);
  const [form, setForm] = useState(emptyForm());
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (selectedCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: selectedCategory.name, description: selectedCategory.description ?? '', color: selectedCategory.color ?? DEFAULT_CATEGORY_COLOR });
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
        await updateCategory(selectedCategory.id, { name: form.name.trim(), description: form.description.trim(), color: form.color });
        messagePopup.getState().success('Categoria aggiornata.');
      } else {
        await addCategory({ name: form.name.trim(), description: form.description.trim(), color: form.color });
        messagePopup.getState().success('Categoria aggiunta.');
      }
      await fetchCategories();
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
        await restoreCategory(selectedCategory.id);
        messagePopup.getState().success('Categoria ripristinata.');
      } else {
        await archiveCategory(selectedCategory.id);
        messagePopup.getState().success('Categoria archiviata.');
      }
      await fetchCategories();
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
      subtitle="Categoria per i servizi del listino"
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
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full shrink-0 border border-zinc-300 dark:border-zinc-600" style={{ backgroundColor: form.color }} />
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="es. Colore, Taglio, Trattamento..."
            />
          </div>
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
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Colore</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_PICKER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className="size-6 rounded-md border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: form.color === c ? 'white' : 'transparent',
                  outline: form.color === c ? `2px solid ${c}` : 'none',
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </div>
    </AddModal>
  );
}
