'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgePercent, Plus, Search } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { AbbonamentiTable } from '@/lib/components/admin/abbonamenti/AbbonamentiTable';
import { AddAbbonamentoModal } from '@/lib/components/admin/abbonamenti/AddAbbonamentoModal';
import { EditAbbonamentoModal } from '@/lib/components/admin/abbonamenti/EditAbbonamentoModal';
import { DeleteAbbonamentoModal } from '@/lib/components/admin/abbonamenti/DeleteAbbonamentoModal';
import type { Abbonamento } from '@/lib/types/Abbonamento';

export default function AbbonamentiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abbonamenti = useAbbonamentiStore((s) => s.abbonamenti);
  const isLoading = useAbbonamentiStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);

  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [commandTarget, setCommandTarget] = useState<Abbonamento | null>(null);
  const [commandMode, setCommandMode] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setAddOpen(true);
      router.replace('/admin/abbonamenti');
      return;
    }
    const editId = searchParams.get('edit');
    if (editId) {
      const abb = useAbbonamentiStore.getState().abbonamenti.find((a) => a.id === editId);
      if (abb) { setCommandTarget(abb); setCommandMode('edit'); }
      router.replace('/admin/abbonamenti');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const abb = useAbbonamentiStore.getState().abbonamenti.find((a) => a.id === deleteId);
      if (abb) { setCommandTarget(abb); setCommandMode('delete'); }
      router.replace('/admin/abbonamenti');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return abbonamenti;
    const clientNames = new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`.toLowerCase()]));
    return abbonamenti.filter((a) => (clientNames.get(a.client_id) ?? '').includes(q));
  }, [abbonamenti, clients, query]);

  return (
    <>
      <AddAbbonamentoModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
      <EditAbbonamentoModal
        isOpen={commandMode === 'edit'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        abbonamento={commandTarget}
      />
      <DeleteAbbonamentoModal
        isOpen={commandMode === 'delete'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        abbonamento={commandTarget}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Abbonamenti"
          subtitle="Pacchetti prepagati per chi torna spesso."
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
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {isLoading ? <TableSkeleton /> : <AbbonamentiTable abbonamenti={filtered} />}
      </div>
    </>
  );
}
