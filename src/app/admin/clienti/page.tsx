'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, FileDown, FileSpreadsheet, TableProperties, LayoutGrid, Users, ArrowDownToLine, Archive, Trash2 } from 'lucide-react';
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
import { Button } from '@/lib/components/shared/ui/Button';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { DropdownMenu, type DropdownMenuItem } from '@/lib/components/shared/ui/DropdownMenu';
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
  const [commandDelete, setCommandDelete] = useState<Client | null>(null);

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

  const archivedCount = clients.filter((c) => c.isArchived).length;

  const menuItems: DropdownMenuItem[] = [
    {
      label: showArchived ? 'Mostra clienti attivi' : 'Mostra clienti archiviati',
      icon: Archive,
      onClick: () => setShowArchived(!showArchived),
      badge: archivedCount > 0 ? archivedCount : undefined,
    },
    { label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) },
    { label: 'Esporta PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
    { label: 'Esporta CSV', icon: FileSpreadsheet, onClick: () => { /* TODO: export CSV */ } },
    ...(clients.length > 0
      ? ([{ label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true }] as DropdownMenuItem[])
      : []),
  ];

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
              <Button
                variant="primary"
                leadingIcon={UserPlus}
                onClick={() => setShowAdd(true)}
                className="whitespace-nowrap"
              >
                Nuovo cliente
              </Button>
              <DropdownMenu items={menuItems} />
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
