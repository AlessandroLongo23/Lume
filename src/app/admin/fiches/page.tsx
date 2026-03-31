'use client';

import { useState, useMemo } from 'react';
import { Ticket, Download, TableProperties, LayoutGrid } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useSearchStore } from '@/lib/stores/search';
import { AddFicheModal } from '@/lib/components/admin/fiches/AddFicheModal';
import { FichesTable } from '@/lib/components/admin/fiches/FichesTable';
import { FichesGrid } from '@/lib/components/admin/fiches/FichesGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

export default function FichesPage() {
  const fiches = useFichesStore((s) => s.fiches);
  const query = useSearchStore((s) => s.query);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return fiches;
    const q = query.toLowerCase();
    return fiches.filter((f) =>
      ['status', 'note'].some((k) =>
        String(f[k as keyof typeof f])?.toLowerCase().includes(q)
      )
    );
  }, [fiches, query]);

  const title = !query
    ? `Tutte le fiches (${filtered.length})`
    : filtered.length === 0 ? 'Nessuna fiche trovata'
    : filtered.length === 1 ? '1 fiche trovata'
    : `${filtered.length} fiches trovate`;

  return (
    <>
      <AddFicheModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <div className="flex flex-row items-center gap-4">
            <Searchbar placeholder="Cerca fiche" className="w-80" />
            <ToggleButton
              value={view}
              onChange={setView}
              options={['table', 'grid']}
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
              <Ticket className="size-5" />
              <span>Nuova fiche</span>
            </button>
          </div>
        </div>

        {view === 'table' ? <FichesTable fiches={filtered} /> : <FichesGrid fiches={filtered} />}
      </div>
    </>
  );
}
