'use client';

import { useState, useMemo } from 'react';
import { UserPlus, Download, TableProperties, LayoutGrid } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useViewsStore } from '@/lib/stores/views';
import { useSearchStore } from '@/lib/stores/search';
import { AddOperatorModal } from '@/lib/components/admin/operators/AddOperatorModal';
import { OperatorsTable } from '@/lib/components/admin/operators/OperatorsTable';
import { OperatorsGrid } from '@/lib/components/admin/operators/OperatorsGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

export default function OperatoriPage() {
  const operators = useOperatorsStore((s) => s.operators);
  const view = useViewsStore((s) => s.operators);
  const setView = useViewsStore((s) => s.setView);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return operators;
    const q = query.toLowerCase();
    return operators.filter((o) =>
      ['firstName', 'lastName', 'email'].some((k) =>
        String(o[k as keyof typeof o])?.toLowerCase().includes(q)
      )
    );
  }, [operators, query]);

  const title = !query
    ? `Tutti gli operatori (${filtered.length})`
    : filtered.length === 0 ? 'Nessun operatore trovato'
    : filtered.length === 1 ? '1 operatore trovato'
    : `${filtered.length} operatori trovati`;

  return (
    <>
      <AddOperatorModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <div className="flex flex-row items-center gap-4">
            <Searchbar placeholder="Cerca operatore" className="w-80" />
            <ToggleButton
              value={view}
              onChange={(v) => setView('operators', v)}
              options={['table', 'grid']}
              labels={['Tabella', 'Griglia']}
              icons={[TableProperties, LayoutGrid]}
            />
            <button className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg border border-zinc-500/25">
              <Download className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Scarica PDF</span>
            </button>
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <UserPlus className="size-5" />
              <span>Nuovo operatore</span>
            </button>
          </div>
        </div>

        {view === 'table' ? <OperatorsTable operators={filtered} /> : <OperatorsGrid operators={filtered} />}
      </div>
    </>
  );
}
