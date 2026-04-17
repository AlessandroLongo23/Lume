'use client';

import { useState, useMemo } from 'react';
import { BadgePercent, Plus, Search } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { AbbonamentiTable } from '@/lib/components/admin/abbonamenti/AbbonamentiTable';
import { AddAbbonamentoModal } from '@/lib/components/admin/abbonamenti/AddAbbonamentoModal';

export default function AbbonamentiPage() {
  const abbonamenti = useAbbonamentiStore((s) => s.abbonamenti);
  const isLoading = useAbbonamentiStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);

  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return abbonamenti;
    const clientNames = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`.toLowerCase()]));
    return abbonamenti.filter((a) => (clientNames.get(a.client_id) ?? '').includes(q));
  }, [abbonamenti, clients, query]);

  return (
    <>
      <AddAbbonamentoModal isOpen={addOpen} onClose={() => setAddOpen(false)} />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Abbonamenti"
          icon={BadgePercent}
          actions={
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              <Plus className="size-4" />
              Nuovo abbonamento
            </button>
          }
        />

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per cliente…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {isLoading ? <TableSkeleton /> : <AbbonamentiTable abbonamenti={filtered} />}
      </div>
    </>
  );
}
