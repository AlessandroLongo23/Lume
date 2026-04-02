'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Table } from '@/lib/components/admin/table/Table';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { Supplier } from '@/lib/types/Supplier';
import { AddFornitoreModal } from './AddFornitoreModal';

export function FornitoriTab() {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const isLoading = useSuppliersStore((s) => s.isLoading);
  const deleteSupplier = useSuppliersStore((s) => s.deleteSupplier);

  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);

  const handleEditClick = (e: React.MouseEvent, item: Supplier) => {
    e.stopPropagation();
    setSelected(item);
    setShowAdd(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: Supplier) => {
    e.stopPropagation();
    setSelected(item);
    setShowDelete(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteSupplier(selected.id);
      messagePopup.getState().success('Fornitore eliminato.');
      setShowDelete(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  return (
    <>
      <AddFornitoreModal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setSelected(null); }}
        selectedSupplier={selected}
      />
      <AddModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onSubmit={handleDelete}
        title="Elimina Fornitore"
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
          Sei sicuro di voler eliminare il fornitore{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">{selected?.name}</strong>?
        </p>
      </AddModal>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {suppliers.length} {suppliers.length === 1 ? 'fornitore' : 'fornitori'}
          </p>
          <button
            onClick={() => { setSelected(null); setShowAdd(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            <Plus className="size-4" />
            Nuovo Fornitore
          </button>
        </div>
        <Table
          columns={Supplier.dataColumns}
          data={suppliers}
          isLoading={isLoading}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          labelPlural="fornitori"
          labelSingular="fornitore"
        />
      </div>
    </>
  );
}
