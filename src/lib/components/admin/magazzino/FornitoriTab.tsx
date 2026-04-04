'use client';

import { useState, useEffect } from 'react';
import { Trash2, Truck, Plus, ArrowDownToLine } from 'lucide-react';
import { Table } from '@/lib/components/admin/table/Table';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { Supplier } from '@/lib/types/Supplier';
import { AddFornitoreModal } from './AddFornitoreModal';

interface FornitoriTabProps {
  addTrigger?: number;
}

export function FornitoriTab({ addTrigger }: FornitoriTabProps) {
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const isLoading = useSuppliersStore((s) => s.isLoading);
  const deleteSupplier = useSuppliersStore((s) => s.deleteSupplier);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!addTrigger) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(null);
    setShowAdd(true);
  }, [addTrigger]);

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
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />
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

      {!isLoading && suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nessun fornitore trovato"
          description="Aggiungi il tuo primo fornitore per gestire gli approvvigionamenti."
          secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
          action={{ label: 'Nuovo fornitore', icon: Plus, onClick: () => { setSelected(null); setShowAdd(true); } }}
        />
      ) : (
        <div className="flex flex-col gap-4">
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
      )}
    </>
  );
}
