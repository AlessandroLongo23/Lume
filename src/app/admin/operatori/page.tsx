'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { UserPlus, Users, EllipsisVertical, Archive } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useSearchStore } from '@/lib/stores/search';
import { AddOperatorModal } from '@/lib/components/admin/operators/AddOperatorModal';
import { OperatorsTable } from '@/lib/components/admin/operators/OperatorsTable';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

export default function OperatoriPage() {
  const operators = useOperatorsStore((s) => s.operators);
  const showArchived = useOperatorsStore((s) => s.showArchived);
  const setShowArchived = useOperatorsStore((s) => s.setShowArchived);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const filtered = useMemo(() => {
    let list = operators;
    if (!showArchived) list = list.filter((o) => !o.isArchived);
    else list = list.filter((o) => o.isArchived);
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((o) =>
      ['firstName', 'lastName', 'email'].some((k) =>
        String(o[k as keyof typeof o])?.toLowerCase().includes(q)
      )
    );
  }, [operators, query, showArchived]);

  const activeCount = operators.filter((o) => !o.isArchived).length;
  const archivedCount = operators.filter((o) => o.isArchived).length;

  const title = showArchived
    ? `Operatori archiviati (${archivedCount})`
    : !query
      ? `Tutti gli operatori (${activeCount})`
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
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <Users className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              {showArchived ? 'Nessun operatore archiviato' : 'Nessun operatore trovato'}
            </h3>
            <p className="text-sm text-zinc-500 text-center max-w-md">
              {showArchived ? 'Non ci sono operatori archiviati.' : 'Non ci sono operatori registrati.'}
            </p>
          </div>
        ) : (
          <OperatorsTable operators={filtered} showArchived={showArchived} />
        )}
      </div>
    </>
  );
}
