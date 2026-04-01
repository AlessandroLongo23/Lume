'use client';

import { useState } from 'react';
import { ArchiveRestore } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Operator } from '@/lib/types/Operator';
import { Table } from '@/lib/components/admin/table/Table';
import { EditOperatorModal } from './EditOperatorModal';
import { DeleteOperatorModal } from './DeleteOperatorModal';

interface OperatorsTableProps {
  operators: Operator[];
  showArchived?: boolean;
}

export function OperatorsTable({ operators, showArchived = false }: OperatorsTableProps) {
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [editedOperator, setEditedOperator] = useState<Partial<Operator>>({});

  const handleEditClick = (e: React.MouseEvent, operator: Operator) => {
    e.stopPropagation();
    setSelectedOperator(operator);
    setEditedOperator(new Operator(operator));
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, operator: Operator) => {
    e.stopPropagation();
    setSelectedOperator(operator);
    setShowDelete(true);
  };

  const handleRestore = async (e: React.MouseEvent, operator: Operator) => {
    e.stopPropagation();
    try {
      await restoreOperator(operator.id);
      messagePopup.getState().success('Operatore ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  return (
    <>
      <Table
        columns={Operator.dataColumns}
        data={operators}
        handleEditClick={showArchived ? undefined : handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl={showArchived ? undefined : 'operatori'}
        isLoading={isLoading}
        labelPlural="operatori"
        labelSingular="operatore"
        extraActions={showArchived ? (operator: Operator) => (
          <button
            onClick={(e) => handleRestore(e, operator)}
            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Ripristina operatore"
          >
            <ArchiveRestore className="size-4 text-zinc-500 hover:text-emerald-500" />
          </button>
        ) : undefined}
      />
      <EditOperatorModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedOperator={editedOperator} onEditedOperatorChange={setEditedOperator} selectedOperator={selectedOperator} />
      <DeleteOperatorModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOperator={selectedOperator} />
    </>
  );
}
