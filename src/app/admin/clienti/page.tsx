'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { UserPlus, FileDown, FileSpreadsheet, TableProperties, LayoutGrid, Users, ArrowDownToLine, EllipsisVertical, Archive } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { useClientsStore } from '@/lib/stores/clients';
import { useViewsStore } from '@/lib/stores/views';
import { AddClientModal } from '@/lib/components/admin/clients/AddClientModal';
import { ClientsTable } from '@/lib/components/admin/clients/ClientsTable';
import { ClientsGrid } from '@/lib/components/admin/clients/ClientsGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';

export default function ClientiPage() {
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const showArchived = useClientsStore((s) => s.showArchived);
  const setShowArchived = useClientsStore((s) => s.setShowArchived);
  const view = useViewsStore((s) => s.clients);
  const setView = useViewsStore((s) => s.setView);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
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

  const archivedCount = clients.filter((c) => c.isArchived).length;

  const visibleClients = useMemo(
    () => clients.filter((c) => (showArchived ? c.isArchived : !c.isArchived)),
    [clients, showArchived]
  );

  return (
    <>
      <AddClientModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-6">
        <PageHeader
          title={showArchived ? 'Clienti archiviati' : 'Clienti'}
          icon={Users}
          actions={
            <>
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
                      {showArchived ? 'Mostra clienti attivi' : 'Mostra clienti archiviati'}
                      {archivedCount > 0 && (
                        <span className="ml-auto text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                          {archivedCount}
                        </span>
                      )}
                    </button>
                    <button
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                      onClick={() => { setMenuOpen(false); /* TODO: export PDF */ }}
                    >
                      <FileDown className="size-4 text-zinc-400" />
                      Esporta PDF
                    </button>
                    <button
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                      onClick={() => { setMenuOpen(false); /* TODO: export CSV */ }}
                    >
                      <FileSpreadsheet className="size-4 text-zinc-400" />
                      Esporta CSV
                    </button>
                  </div>
                )}
              </div>
            </>
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nessun cliente trovato"
            description="Aggiungi il tuo primo cliente per iniziare a gestire la tua lista."
            secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
            action={{ label: 'Nuovo cliente', icon: UserPlus, onClick: () => setShowAdd(true) }}
          />
        ) : view === 'table' ? (
          <ClientsTable clients={visibleClients} showArchived={showArchived} />
        ) : (
          <ClientsGrid clients={visibleClients} showArchived={showArchived} />
        )}
      </div>
    </>
  );
}
