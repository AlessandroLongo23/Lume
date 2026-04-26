'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { UserPlus, EllipsisVertical, Archive, Users, ArrowDownToLine, UserCog } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { AddOperatorModal } from '@/lib/components/admin/operators/AddOperatorModal';
import { EditOperatorModal } from '@/lib/components/admin/operators/EditOperatorModal';
import { DeleteOperatorModal } from '@/lib/components/admin/operators/DeleteOperatorModal';
import { OperatorsTable } from '@/lib/components/admin/operators/OperatorsTable';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { onCommand } from '@/lib/components/shell/commandMenu/events';
import type { Operator } from '@/lib/types/Operator';

export default function OperatoriPage() {
  const operators = useOperatorsStore((s) => s.operators);
  const isLoading = useOperatorsStore((s) => s.isLoading);
  const showArchived = useOperatorsStore((s) => s.showArchived);
  const setShowArchived = useOperatorsStore((s) => s.setShowArchived);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandTarget, setCommandTarget] = useState<Operator | null>(null);
  const [editedOperator, setEditedOperator] = useState<Partial<Operator>>({});
  const [commandMode, setCommandMode] = useState<'edit' | 'delete' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return onCommand('operator', (detail) => {
      if (detail.kind === 'open-add') {
        setShowAdd(true);
        return;
      }
      const op = useOperatorsStore.getState().operators.find((o) => o.id === detail.id);
      if (!op) return;
      setCommandTarget(op);
      if (detail.kind === 'open-edit') {
        setEditedOperator(op);
        setCommandMode('edit');
      } else if (detail.kind === 'open-delete') {
        setCommandMode('delete');
      }
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const archivedCount = operators.filter((o) => o.isArchived).length;

  const visibleOperators = useMemo(
    () => operators.filter((o) => (showArchived ? o.isArchived : !o.isArchived)),
    [operators, showArchived]
  );

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
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <PageHeader
          title={showArchived ? 'Operatori archiviati' : 'Operatori'}
          subtitle="Il tuo team, turni e permessi sotto controllo."
          icon={UserCog}
          actions={
            <>
              <button
                className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
                onClick={() => setShowAdd(true)}
              >
                <UserPlus className="size-5" />
                <span>Nuovo operatore</span>
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center justify-center size-9 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <EllipsisVertical className="size-4 text-zinc-500" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-20 py-1">
                    <button
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                      onClick={() => { setShowArchived(!showArchived); setMenuOpen(false); }}
                    >
                      <Archive className="size-4 text-zinc-400" />
                      {showArchived ? 'Mostra operatori attivi' : 'Mostra operatori archiviati'}
                      {archivedCount > 0 && (
                        <span className="ml-auto text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                          {archivedCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
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
