'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, FileDown, FileSpreadsheet, TableProperties, LayoutGrid, Users, ArrowDownToLine, EllipsisVertical, Archive, Trash2 } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { useClientsStore } from '@/lib/stores/clients';
import { useViewsStore } from '@/lib/stores/views';
import { AddClientModal } from '@/lib/components/admin/clients/AddClientModal';
import { DeleteClientModal } from '@/lib/components/admin/clients/DeleteClientModal';
import { ClientsTable } from '@/lib/components/admin/clients/ClientsTable';
import { ClientsGrid } from '@/lib/components/admin/clients/ClientsGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import type { Client } from '@/lib/types/Client';

export default function ClientiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clients = useClientsStore((s) => s.clients);
  const isLoading = useClientsStore((s) => s.isLoading);
  const showArchived = useClientsStore((s) => s.showArchived);
  const setShowArchived = useClientsStore((s) => s.setShowArchived);
  const deleteAllClients = useClientsStore((s) => s.deleteAllClients);
  const view = useViewsStore((s) => s.clients);
  const setView = useViewsStore((s) => s.setView);

  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandDelete, setCommandDelete] = useState<Client | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Read command-palette query params: ?new=1 / ?delete=<id>.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowAdd(true);
      router.replace('/admin/clienti');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const client = useClientsStore.getState().clients.find((c) => c.id === deleteId);
      if (client) setCommandDelete(client);
      router.replace('/admin/clienti');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      <DeleteClientModal
        isOpen={commandDelete !== null}
        onClose={() => setCommandDelete(null)}
        selectedClient={commandDelete}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} entity="clients" />
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="clienti"
        count={clients.length}
        cascadeNotice={
          <>
            Verranno cancellate anche <strong>tutte le fiche</strong>, gli abbonamenti e i coupon
            collegati. Lo storico del bilancio risulterà <strong>permanentemente alterato</strong>.
          </>
        }
        onConfirm={deleteAllClients}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <PageHeader
          title={showArchived ? 'Clienti archiviati' : 'Clienti'}
          subtitle="Ricorda ogni persona che entra nel tuo salone."
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
                className="btn-primary whitespace-nowrap"
                onClick={() => setShowAdd(true)}
              >
                <UserPlus className="size-5" />
                <span>Nuovo cliente</span>
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center justify-center size-9 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Altre azioni"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <EllipsisVertical className="size-4 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 top-full mt-1 w-64 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-dropdown py-1">
                    <button
                      role="menuitem"
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => { setShowArchived(!showArchived); setMenuOpen(false); }}
                    >
                      <Archive className="size-4 text-muted-foreground" />
                      {showArchived ? 'Mostra clienti attivi' : 'Mostra clienti archiviati'}
                      {archivedCount > 0 && (
                        <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {archivedCount}
                        </span>
                      )}
                    </button>
                    <button
                      role="menuitem"
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => { setShowImport(true); setMenuOpen(false); }}
                    >
                      <ArrowDownToLine className="size-4 text-muted-foreground" />
                      Importa dati
                    </button>
                    <button
                      role="menuitem"
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => { setMenuOpen(false); /* TODO: export PDF */ }}
                    >
                      <FileDown className="size-4 text-muted-foreground" />
                      Esporta PDF
                    </button>
                    <button
                      role="menuitem"
                      className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-foreground hover:bg-muted/60 transition-colors"
                      onClick={() => { setMenuOpen(false); /* TODO: export CSV */ }}
                    >
                      <FileSpreadsheet className="size-4 text-muted-foreground" />
                      Esporta CSV
                    </button>
                    {clients.length > 0 && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <button
                          role="menuitem"
                          className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-[var(--lume-danger-fg)] hover:bg-[var(--lume-danger-bg)] transition-colors"
                          onClick={() => { setShowDeleteAll(true); setMenuOpen(false); }}
                        >
                          <Trash2 className="size-4" />
                          Elimina tutti
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          }
        />

        {isLoading ? (
          <TableSkeleton />
        ) : visibleClients.length === 0 ? (
          showArchived ? (
            <EmptyState
              icon={Archive}
              title="Nessun cliente archiviato"
              description="I clienti che archivierai compariranno qui. Potrai sempre ripristinarli."
              action={{ label: 'Vedi clienti attivi', icon: Users, onClick: () => setShowArchived(false) }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Nessun cliente trovato"
              description="Aggiungi il tuo primo cliente per iniziare a gestire la tua lista."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuovo cliente', icon: UserPlus, onClick: () => setShowAdd(true) }}
            />
          )
        ) : view === 'table' ? (
          <ClientsTable clients={visibleClients} showArchived={showArchived} />
        ) : (
          <ClientsGrid clients={visibleClients} showArchived={showArchived} />
        )}
      </div>
    </>
  );
}
