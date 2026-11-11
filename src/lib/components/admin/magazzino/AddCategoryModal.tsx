'use client';

import { useState, useEffect } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { ColorSwatchPicker } from '@/lib/components/shared/ui/forms/ColorSwatchPicker';
import { Button } from '@/lib/components/shared/ui/Button';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';
import type { ProductCategory } from '@/lib/types/ProductCategory';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: ProductCategory | null;
}

const emptyForm = () => ({ name: '', description: '', color: DEFAULT_CATEGORY_COLOR });

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
      setForm({
        name: selectedCategory.name,
        description: selectedCategory.description ?? '',
        color: selectedCategory.color ?? DEFAULT_CATEGORY_COLOR,
      });
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
        await updateProductCategory(selectedCategory.id, { name: form.name.trim(), description: form.description.trim(), color: form.color });
        messagePopup.getState().success('Categoria aggiornata.');
      } else {
        await addProductCategory({ name: form.name.trim(), description: form.description.trim(), color: form.color });
        messagePopup.getState().success('Categoria aggiunta.');
        // Advances an interactive guide's "save" step on a successful create.
        emitTourEvent('product-category:created');
      }
      await fetchProductCategories();
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


  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={selectedCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
      subtitle="Categoria per i prodotti del magazzino"
      confirmText={selectedCategory ? 'Aggiorna' : 'Aggiungi'}
      classes="max-w-sm"
      confirmDataTour="save-product-category"
      onEnterComplete={() => emitTourEvent('product-category:modal-open')}
      footerContent={
        selectedCategory && (
          <Button
            variant="secondary"
            leadingIcon={selectedCategory.isArchived ? ArchiveRestore : Archive}
            onClick={handleToggleArchive}
          >
            {selectedCategory.isArchived ? 'Ripristina' : 'Archivia'}
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="Nome"
          required
          data-tour="field-product-category-name"
          icon={<span aria-hidden className="block size-3 rounded-full" style={{ backgroundColor: form.color }} />}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="es. Coloranti, Shampoo..."
          error={nameError || undefined}
        />
        <FormInput
          label="Descrizione"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Descrizione opzionale"
        />
        <div data-tour="field-product-category-color">
          <Field label="Colore">
            {() => (
              <ColorSwatchPicker
                value={form.color}
                onChange={(c) => setForm((f) => ({ ...f, color: c ?? DEFAULT_CATEGORY_COLOR }))}
                columns={6}
              />
            )}
          </Field>
        </div>
      </div>
    </AddModal>
  );
}
