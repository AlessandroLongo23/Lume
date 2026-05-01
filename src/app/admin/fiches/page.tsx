'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, TableProperties, LayoutGrid, Calendar, FileDown, Search, X, ArrowDownToLine } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from '@/lib/components/admin/fiches/DeleteFicheModal';
import { FichesTable } from '@/lib/components/admin/fiches/FichesTable';
import { FichesGrid } from '@/lib/components/admin/fiches/FichesGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import type { Fiche } from '@/lib/types/Fiche';
import { useViewsStore } from '@/lib/stores/views';
import { useOrderedTabs } from '@/lib/hooks/useOrderedTabs';
import { TAB_DEFAULTS, TAB_LABELS } from '@/lib/const/tab-defaults';

type TabValue = 'active' | 'completed' | 'all';

const DEFAULT_ORDER = TAB_DEFAULTS.fiches as readonly TabValue[];

export default function FichesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiches = useFichesStore((s) => s.fiches);
  const isLoading = useFichesStore((s) => s.isLoading);
  const clients = useClientsStore((s) => s.clients);

  const view = useViewsStore((s) => s.fiches);
  const setView = (v: 'table' | 'grid') => useViewsStore.getState().setView('fiches', v);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { visible } = useOrderedTabs<TabValue>('fiches', DEFAULT_ORDER);
  const [userTab, setUserTab] = useState<TabValue | null>(null);
  const activeTab: TabValue = userTab && visible.includes(userTab) ? userTab : visible[0];
  const setActiveTab = (t: TabValue) => setUserTab(t);
  const [globalFilter, setGlobalFilter] = useState('');
  const [prefillClientId, setPrefillClientId] = useState<string | null>(null);
  const [commandTarget, setCommandTarget] = useState<Fiche | null>(null);
  const [commandMode, setCommandMode] = useState<'edit' | 'delete' | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      const clientId = searchParams.get('client');
      setPrefillClientId(clientId);
      setShowAdd(true);
      router.replace('/admin/fiches');
      return;
    }
    const editId = searchParams.get('edit');
    if (editId) {
      const fiche = useFichesStore.getState().fiches.find((f) => f.id === editId);
      if (fiche) { setCommandTarget(fiche); setCommandMode('edit'); }
      router.replace('/admin/fiches');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const fiche = useFichesStore.getState().fiches.find((f) => f.id === deleteId);
      if (fiche) { setCommandTarget(fiche); setCommandMode('delete'); }
      router.replace('/admin/fiches');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const counts = useMemo(() => ({
    active: fiches.filter((f) => f.status !== FicheStatus.COMPLETED).length,
    completed: fiches.filter((f) => f.status === FicheStatus.COMPLETED).length,
    all: fiches.length,
  }), [fiches]);

  const filteredFiches = useMemo(() => {
    let data = fiches;
    if (activeTab === 'active') data = data.filter((f) => f.status !== FicheStatus.COMPLETED);
    else if (activeTab === 'completed') data = data.filter((f) => f.status === FicheStatus.COMPLETED);
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((f) => {
        const client = clientMap.get(f.client_id);
        const fullName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
        return fullName.includes(q) || f.status.toLowerCase().includes(q);
      });
    }
    return data;
  }, [fiches, activeTab, globalFilter, clientMap]);

  return (
    <>
      <FicheModal
        mode="add"
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setPrefillClientId(null); }}
        clientId={prefillClientId}
      />
      <FicheModal
        mode="edit"
        isOpen={commandMode === 'edit'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        fiche={commandTarget}
      />
      <DeleteFicheModal
        isOpen={commandMode === 'delete'}
        onClose={() => { setCommandMode(null); setCommandTarget(null); }}
        selectedFiche={commandTarget}
      />
      <ConciergeImportModal isOpen={showImport} onClose={() => setShowImport(false)} />

      <div className="flex flex-col gap-8">
        <PageHeader
          title="Fiches"
          subtitle="La storia di ogni visita, dal check-in al saldo."
          icon={Ticket}
          actions={
            <>
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
                { label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) },
                { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
              ]} />
            </>
          }
        />

        <div className="flex flex-col">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 border-b border-border">
            {visible.map((id) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={[
                  'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === id
                    ? 'border-primary text-primary-hover dark:text-primary/70'
                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
                ].join(' ')}
              >
                {TAB_LABELS.fiches[id]}
                <NumberBadge value={counts[id]} variant={activeTab === id ? 'primary' : 'neutral'} size="md" />
              </button>
            ))}
          </div>

          {/* Search (grid view only — table view embeds the search in its toolbar) */}
          {view === 'grid' && (
            <div className="py-4">
              <div className="relative flex items-center max-w-sm">
                <Search className="absolute left-2.5 size-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca fiche..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
                    border-zinc-200 dark:border-zinc-800
                    focus:border-zinc-300 dark:focus:border-zinc-700
                    text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 outline-none transition-colors"
                />
                {globalFilter && (
                  <button
                    onClick={() => setGlobalFilter('')}
                    className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <TableSkeleton />
          ) : fiches.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nessuna fiche trovata"
              description="Crea la tua prima fiche per iniziare a registrare gli appuntamenti."
              secondaryAction={{ label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) }}
              action={{ label: 'Nuova fiche', icon: Ticket, onClick: () => setShowAdd(true) }}
            />
          ) : view === 'table' ? (
            <div className="pt-4">
              <FichesTable
                fiches={filteredFiches}
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
              />
            </div>
          ) : (
            <FichesGrid fiches={filteredFiches} />
          )}
        </div>
      </div>
    </>
  );
}
