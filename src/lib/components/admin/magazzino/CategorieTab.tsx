'use client';

import { useState, useEffect } from 'react';
import { Trash2, Tags, Plus, ArrowDownToLine } from 'lucide-react';
import { Table } from '@/lib/components/admin/table/Table';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { ProductCategory } from '@/lib/types/ProductCategory';
import { AddCategoryModal } from './AddCategoryModal';

interface CategorieTabProps {
  addTrigger?: number;
}

export function CategorieTab({ addTrigger }: CategorieTabProps) {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const isLoading = useProductCategoriesStore((s) => s.isLoading);
  const deleteProductCategory = useProductCategoriesStore((s) => s.deleteProductCategory);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<ProductCategory | null>(null);

  useEffect(() => {
    if (!addTrigger) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(null);
    setShowAdd(true);
  }, [addTrigger]);

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
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
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

      {!isLoading && categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nessuna categoria trovata"
          description="Crea la tua prima categoria per organizzare i prodotti."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuova categoria', icon: Plus, onClick: () => { setSelected(null); setShowAdd(true); } }}
        />
      ) : (
        <div className="flex flex-col gap-4">
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
      )}
    </>
  );
}
