'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { OperatorCard } from './OperatorCard';
import { EditOperatorModal } from './EditOperatorModal';
import { DeleteOperatorModal } from './DeleteOperatorModal';
import type { Operator } from '@/lib/types/Operator';

interface OperatorsGridProps {
  operators: Operator[];
}

export function OperatorsGrid({ operators }: OperatorsGridProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [editedOperator, setEditedOperator] = useState<Partial<Operator>>({});

  const handleEdit = (operator: Operator) => {
    setSelectedOperator(operator);
    setEditedOperator({ ...operator });
    setShowEdit(true);
  };

  const handleDelete = (operator: Operator) => {
    setSelectedOperator(operator);
    setShowDelete(true);
  };

  return (
    <div>
      {operators.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
          <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-1">Nessun operatore trovato</h3>
          <p className="text-sm text-zinc-500 text-center max-w-md">Non ci sono operatori registrati.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((operator) => (
            <OperatorCard key={operator.id} operator={operator} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <EditOperatorModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedOperator={editedOperator} onEditedOperatorChange={setEditedOperator} selectedOperator={selectedOperator} />
      <DeleteOperatorModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedOperator={selectedOperator} />
    </div>
  );
}
