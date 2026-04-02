'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Table } from '@/lib/components/admin/table/Table';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { ProductCategory } from '@/lib/types/ProductCategory';
import { AddCategoryModal } from './AddCategoryModal';

export function CategorieTab() {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const isLoading = useProductCategoriesStore((s) => s.isLoading);
  const deleteProductCategory = useProductCategoriesStore((s) => s.deleteProductCategory);

  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ProductCategory | null>(null);

  const handleEditClick = (e: React.MouseEvent, item: ProductCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: ProductCategory) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteProductCategory(selected.id);
      messagePopup.getState().success('Categoria eliminata.');
      setShowDelete(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  return (
    <>
      <AddCategoryModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedCategory={selected}
      />
      <AddModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onSubmit={handleDelete}
        title="Elimina Categoria"
        subtitle={selected ? `Stai eliminando: ${selected.name}` : ''}
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
          Sei sicuro di voler eliminare la categoria{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">{selected?.name}</strong>?
        </p>
      </AddModal>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {categories.length} {categories.length === 1 ? 'categoria' : 'categorie'}
          </p>
          <button
            onClick={() => { setSelected(null); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            <Plus className="size-4" />
            Nuova Categoria
          </button>
        </div>
        <Table
          columns={ProductCategory.dataColumns}
          data={categories}
          isLoading={isLoading}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          labelPlural="categorie"
          labelSingular="categoria"
        />
      </div>
    </>
  );
}
