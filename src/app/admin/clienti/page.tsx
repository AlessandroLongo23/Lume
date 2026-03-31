'use client';

import { useState, useMemo } from 'react';
import { UserPlus, Download, TableProperties, LayoutGrid } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { useViewsStore } from '@/lib/stores/views';
import { useSearchStore } from '@/lib/stores/search';
import { AddClientModal } from '@/lib/components/admin/clients/AddClientModal';
import { ClientsTable } from '@/lib/components/admin/clients/ClientsTable';
import { ClientsGrid } from '@/lib/components/admin/clients/ClientsGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

export default function ClientiPage() {
  const clients = useClientsStore((s) => s.clients);
  const view = useViewsStore((s) => s.clients);
  const setView = useViewsStore((s) => s.setView);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return clients;
    const q = query.toLowerCase();
    return clients.filter((c) =>
      ['firstName', 'lastName', 'email', 'phoneNumber'].some((k) =>
        String(c[k as keyof typeof c])?.toLowerCase().includes(q)
      )
    );
  }, [clients, query]);

  const title = !query
    ? `Tutti i clienti (${filtered.length})`
    : filtered.length === 0 ? 'Nessun cliente trovato'
    : filtered.length === 1 ? '1 cliente trovato'
    : `${filtered.length} clienti trovati`;

  return (
    <>
      <AddClientModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <div className="flex flex-row items-center gap-4">
            <Searchbar placeholder="Cerca cliente" className="w-80" />
            <ToggleButton
              value={view}
              onChange={(v) => setView('clients', v)}
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
              <span>Nuovo cliente</span>
            </button>
          </div>
        </div>

        {view === 'table' ? <ClientsTable clients={filtered} /> : <ClientsGrid clients={filtered} />}
      </div>
    </>
  );
}
