'use client';

import { useState } from 'react';
import { UserPlus, FileDown, FileSpreadsheet, TableProperties, LayoutGrid, Users, ArrowDownToLine } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { useClientsStore } from '@/lib/stores/clients';
import { useViewsStore } from '@/lib/stores/views';
import { AddClientModal } from '@/lib/components/admin/clients/AddClientModal';
import { ClientsTable } from '@/lib/components/admin/clients/ClientsTable';
import { ClientsGrid } from '@/lib/components/admin/clients/ClientsGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';

export default function ClientiPage() {
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const view = useViewsStore((s) => s.clients);
  const setView = useViewsStore((s) => s.setView);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  return (
    <>
      <AddClientModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <div className="flex flex-row items-center justify-between gap-4 w-full">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Clienti</h1>
          <div className="flex flex-row items-center gap-4">
            <ToggleButton
              value={view}
              onChange={(v) => setView('clients', v)}
              options={['table', 'grid']}
              labels={['Tabella', 'Griglia']}
              icons={[TableProperties, LayoutGrid]}
            />
            <button
              className="flex flex-row items-center whitespace-nowrap justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={() => setShowAdd(true)}
            >
              <UserPlus className="size-5" />
              <span>Nuovo cliente</span>
            </button>
            <DropdownMenu
              width="w-48"
              items={[
                { label: 'Esporta PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
                { label: 'Esporta CSV', icon: FileSpreadsheet, onClick: () => { /* TODO: export CSV */ } },
              ]}
            />
          </div>
        </div>

        {!isLoading && clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nessun cliente trovato"
            description="Aggiungi il tuo primo cliente per iniziare a gestire la tua lista."
            secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
            action={{ label: 'Nuovo cliente', icon: UserPlus, onClick: () => setShowAdd(true) }}
          />
        ) : view === 'table' ? (
          <ClientsTable clients={clients} />
        ) : (
          <ClientsGrid clients={clients} />
        )}
      </div>
    </>
  );
}
