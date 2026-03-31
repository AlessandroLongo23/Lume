'use client';

import { useState, useMemo } from 'react';
import { Scissors, Download, Tags, TableProperties } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useViewsStore } from '@/lib/stores/views';
import { useSearchStore } from '@/lib/stores/search';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
import { ServicesCategories } from '@/lib/components/admin/services/ServicesCategories';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';

export default function ServiziPage() {
  const services = useServicesStore((s) => s.services);
  const view = useViewsStore((s) => s.services);
  const setView = useViewsStore((s) => s.setView);
  const query = useSearchStore((s) => s.query);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return services;
    const q = query.toLowerCase();
    return services.filter((s) =>
      ['name', 'price', 'duration'].some((k) =>
        String(s[k as keyof typeof s])?.toLowerCase().includes(q)
      )
    );
  }, [services, query]);

  const title = !query
    ? `Tutti i servizi (${filtered.length})`
    : filtered.length === 0 ? 'Nessun servizio trovato'
    : filtered.length === 1 ? '1 servizio trovato'
    : `${filtered.length} servizi trovati`;

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
          <div className="flex flex-row items-center gap-4">
            <Searchbar placeholder="Cerca servizio" className="w-80" />
            <ToggleButton
              value={view}
              onChange={(v) => setView('services', v)}
              options={['categories', 'table']}
              labels={['Categorie', 'Tabella']}
              icons={[Tags, TableProperties]}
            />
            <button className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg border border-zinc-500/25">
              <Download className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Scarica PDF</span>
            </button>
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <Scissors className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Nuovo Servizio</span>
            </button>
          </div>
        </div>

        {view === 'categories' ? <ServicesCategories /> : <ServicesTable services={filtered} />}
      </div>
    </>
  );
}
