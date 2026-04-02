'use client';

import { useState } from 'react';
import { Scissors, Tags, ArrowDownToLine, FileDown } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { ManageCategoriesModal } from '@/lib/components/admin/services/ManageCategoriesModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';

export default function ServiziPage() {
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const [showAdd, setShowAdd] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ManageCategoriesModal isOpen={showManageCategories} onClose={() => setShowManageCategories(false)} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Servizi</h1>
          <div className="flex flex-row items-center gap-4">
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50 rounded-lg border border-zinc-500/25"
              onClick={() => setShowManageCategories(true)}
            >
              <Tags className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Gestisci Categorie</span>
            </button>
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <Scissors className="size-5" strokeWidth={1.5} />
              <span className="font-thin">Nuovo Servizio</span>
            </button>
            <DropdownMenu items={[
              { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
            ]} />
          </div>
        </div>

        {!isLoading && services.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title="Nessun servizio trovato"
            description="Aggiungi il tuo primo servizio per iniziare a gestire il listino."
            secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
            action={{ label: 'Nuovo Servizio', icon: Scissors, onClick: () => setShowAdd(true) }}
          />
        ) : (
          <ServicesTable services={services} />
        )}
      </div>
    </>
  );
}
