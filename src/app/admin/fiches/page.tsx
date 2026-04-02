'use client';

import { useState } from 'react';
import { Ticket, TableProperties, LayoutGrid, Calendar, FileDown } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { AddFicheModal } from '@/lib/components/admin/fiches/AddFicheModal';
import { FichesTable } from '@/lib/components/admin/fiches/FichesTable';
import { FichesGrid } from '@/lib/components/admin/fiches/FichesGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';

export default function FichesPage() {
  const fiches = useFichesStore((s) => s.fiches);
  const isLoading = useFichesStore((s) => s.isLoading);
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <AddFicheModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Fiches</h1>
          <div className="flex flex-row items-center gap-4">
            <ToggleButton
              value={view}
              onChange={setView}
              options={['table', 'grid']}
              labels={['Tabella', 'Griglia']}
              icons={[TableProperties, LayoutGrid]}
            />
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <Ticket className="size-5" />
              <span>Nuova fiche</span>
            </button>
            <DropdownMenu items={[
              { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
            ]} />
          </div>
        </div>

        {!isLoading && fiches.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Nessuna fiche trovata"
            description="Crea la tua prima fiche per iniziare a registrare gli appuntamenti."
            action={{ label: 'Nuova fiche', icon: Ticket, onClick: () => setShowAdd(true) }}
          />
        ) : view === 'table' ? (
          <FichesTable fiches={fiches} />
        ) : (
          <FichesGrid fiches={fiches} />
        )}
      </div>
    </>
  );
}
