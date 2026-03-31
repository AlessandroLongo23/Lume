'use client';

import { useState } from 'react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { Operator } from '@/lib/types/Operator';
import { Table } from '@/lib/components/admin/table/Table';
import { EditOperatorModal } from './EditOperatorModal';
import { DeleteOperatorModal } from './DeleteOperatorModal';

interface OperatorsTableProps {
  operators: Operator[];
}

export function OperatorsTable({ operators }: OperatorsTableProps) {
  const isLoading = useOperatorsStore((s) => s.isLoading);
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

  return (
    <>
      <Table
        columns={Operator.dataColumns}
        data={operators}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl="operatori"
        isLoading={isLoading}
        labelPlural="operatori"
        labelSingular="operatore"
      />
      <EditOperatorModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedOperator={editedOperator} onEditedOperatorChange={setEditedOperator} selectedOperator={selectedOperator} />
      <DeleteOperatorModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOperator={selectedOperator} />
    </>
  );
}
