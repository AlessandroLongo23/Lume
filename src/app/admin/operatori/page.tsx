'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, Archive, Users, ArrowDownToLine, UserCog, Trash2 } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { AddOperatorModal } from '@/lib/components/admin/operators/AddOperatorModal';
import { EditOperatorModal } from '@/lib/components/admin/operators/EditOperatorModal';
import { DeleteOperatorModal } from '@/lib/components/admin/operators/DeleteOperatorModal';
import { OperatorsTable } from '@/lib/components/admin/operators/OperatorsTable';
import { Button } from '@/lib/components/shared/ui/Button';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { DropdownMenu, type DropdownMenuItem } from '@/lib/components/shared/ui/DropdownMenu';
import type { Operator } from '@/lib/types/Operator';

export default function OperatoriPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operators = useOperatorsStore((s) => s.operators);
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const showArchived = useOperatorsStore((s) => s.showArchived);
  const setShowArchived = useOperatorsStore((s) => s.setShowArchived);
  const deleteAllOperators = useOperatorsStore((s) => s.deleteAllOperators);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [commandTarget, setCommandTarget] = useState<Operator | null>(null);
  const [editedOperator, setEditedOperator] = useState<Partial<Operator>>({});
  const [commandMode, setCommandMode] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowAdd(true);
      router.replace('/admin/operatori');
      return;
    }
    const editId = searchParams.get('edit');
    if (editId) {
      const op = useOperatorsStore.getState().operators.find((o) => o.id === editId);
      if (op) { setCommandTarget(op); setEditedOperator(op); setCommandMode('edit'); }
      router.replace('/admin/operatori');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const op = useOperatorsStore.getState().operators.find((o) => o.id === deleteId);
      if (op) { setCommandTarget(op); setCommandMode('delete'); }
      router.replace('/admin/operatori');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const archivedCount = operators.filter((o) => o.isArchived).length;

  const visibleOperators = useMemo(
    () => operators.filter((o) => (showArchived ? o.isArchived : !o.isArchived)),
    [operators, showArchived]
  );

  const menuItems: DropdownMenuItem[] = [
    {
      label: showArchived ? 'Mostra operatori attivi' : 'Mostra operatori archiviati',
      icon: Archive,
      onClick: () => setShowArchived(!showArchived),
      badge: archivedCount > 0 ? archivedCount : undefined,
    },
    { label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) },
    ...(operators.length > 0
      ? ([{ label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true }] as DropdownMenuItem[])
      : []),
  ];

  return (
    <>
      <AddOperatorModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <EditOperatorModal
        isOpen={commandMode === 'edit'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        editedOperator={editedOperator}
        onEditedOperatorChange={setEditedOperator}
        selectedOperator={commandTarget}
      />
      <DeleteOperatorModal
        isOpen={commandMode === 'delete'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        selectedOperator={commandTarget}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} entity="operators" />
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="operatori"
        count={operators.length}
        cascadeNotice={
          <>
            Le fiche già esistenti verranno mantenute, ma i servizi associati non risulteranno
            più collegati ad alcun operatore.
          </>
        }
        onConfirm={deleteAllOperators}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-8">
        <PageHeader
          title={showArchived ? 'Operatori archiviati' : 'Operatori'}
          subtitle="Il tuo team, turni e permessi sotto controllo."
          icon={UserCog}
          actions={
            <>
              <Button
                variant="primary"
                leadingIcon={UserPlus}
                onClick={() => setShowAdd(true)}
                className="whitespace-nowrap"
              >
                Nuovo operatore
              </Button>
              <DropdownMenu items={menuItems} />
            </>
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : operators.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nessun operatore trovato"
            description="Aggiungi il tuo primo operatore per iniziare a gestire il team."
            secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
            action={{ label: 'Nuovo operatore', icon: UserPlus, onClick: () => setShowAdd(true) }}
          />
        ) : (
          <OperatorsTable operators={visibleOperators} showArchived={showArchived} />
        )}
      </div>
    </>
  );
}
