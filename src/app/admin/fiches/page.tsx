'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, TableProperties, LayoutGrid, Calendar, FileDown, ArrowDownToLine, Trash2 } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { FicheBucket, FICHE_BUCKET_LABELS, getFicheBucket } from '@/lib/types/Fiche';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ConciergeImportModal } from '@/lib/components/shared/ui/ConciergeImportModal';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from '@/lib/components/admin/fiches/DeleteFicheModal';
import { FichesTable } from '@/lib/components/admin/fiches/FichesTable';
import { FichesGrid } from '@/lib/components/admin/fiches/FichesGrid';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { Button } from '@/lib/components/shared/ui/Button';
import { Searchbar } from '@/lib/components/shared/ui/Searchbar';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import type { Fiche } from '@/lib/types/Fiche';
import { useViewsStore } from '@/lib/stores/views';
import { useOrderedTabs } from '@/lib/hooks/useOrderedTabs';
import { TAB_DEFAULTS, TAB_LABELS } from '@/lib/const/tab-defaults';

type TabValue = 'prenotate' | 'arretrate' | 'concluse' | 'tutte';

const DEFAULT_ORDER = TAB_DEFAULTS.fiches as readonly TabValue[];

const EMPTY_TAB_TEXT: Record<TabValue, string> = {
  prenotate: 'Nessuna fiche prenotata.',
  arretrate: 'Nessuna fiche arretrata. Tutto in regola.',
  concluse: 'Nessuna fiche conclusa.',
  tutte: 'Nessuna fiche.',
};

export default function FichesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fiches = useFichesStore((s) => s.fiches);
  const isLoading = useFichesStore((s) => s.isLoading);
  const deleteAllFiches = useFichesStore((s) => s.deleteAllFiches);
  const clients = useClientsStore((s) => s.clients);

  const view = useViewsStore((s) => s.fiches);
  const setView = (v: 'table' | 'grid') => useViewsStore.getState().setView('fiches', v);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
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

  const fichesWithBucket = useMemo(
    () => fiches.map((f) => ({ fiche: f, bucket: getFicheBucket(f) })),
    [fiches]
  );

  const counts = useMemo(() => {
    const c = { prenotate: 0, arretrate: 0, concluse: 0, tutte: fiches.length };
    for (const { bucket } of fichesWithBucket) {
      if (bucket === FicheBucket.PRENOTATA) c.prenotate++;
      else if (bucket === FicheBucket.ARRETRATA) c.arretrate++;
      else if (bucket === FicheBucket.CONCLUSA) c.concluse++;
    }
    return c;
  }, [fichesWithBucket, fiches.length]);

  const filteredFiches = useMemo(() => {
    let data = fichesWithBucket;
    if (activeTab === 'prenotate') data = data.filter((d) => d.bucket === FicheBucket.PRENOTATA);
    else if (activeTab === 'arretrate') data = data.filter((d) => d.bucket === FicheBucket.ARRETRATA);
    else if (activeTab === 'concluse') data = data.filter((d) => d.bucket === FicheBucket.CONCLUSA);
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter(({ fiche, bucket }) => {
        const client = clientMap.get(fiche.client_id);
        const fullName = client ? `${client.firstName} ${client.lastName}`.toLowerCase() : '';
        const bucketLabel = FICHE_BUCKET_LABELS[bucket].toLowerCase();
        return fullName.includes(q) || bucketLabel.includes(q);
      });
    }
    return data.map((d) => d.fiche);
  }, [fichesWithBucket, activeTab, globalFilter, clientMap]);

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
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="fiches"
        count={fiches.length}
        cascadeNotice={
          <>
            Verranno eliminati <strong>tutti i pagamenti, servizi e prodotti</strong> registrati
            sulle fiche. Lo storico del bilancio risulterà <strong>permanentemente alterato</strong>.
          </>
        }
        onConfirm={deleteAllFiches}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-8">
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
              <Button
                variant="primary"
                leadingIcon={Ticket}
                onClick={() => setShowAdd(true)}
                className="whitespace-nowrap"
              >
                Nuova fiche
              </Button>
              <DropdownMenu items={[
                { label: 'Importa dati', icon: ArrowDownToLine, onClick: () => setShowImport(true) },
                { label: 'Scarica PDF', icon: FileDown, onClick: () => { /* TODO: export PDF */ } },
                ...(fiches.length > 0
                  ? [{ label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true }]
                  : []),
              ]} />
            </>
          }
        />

        <div className="flex-1 min-h-0 flex flex-col gap-6">
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
            <Searchbar
              className="max-w-sm"
              placeholder="Cerca fiche..."
              value={globalFilter}
              onChange={setGlobalFilter}
            />
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
            <FichesTable
              fiches={filteredFiches}
              globalFilter={globalFilter}
              onGlobalFilterChange={setGlobalFilter}
              emptyText={EMPTY_TAB_TEXT[activeTab]}
            />
          ) : (
            <FichesGrid fiches={filteredFiches} emptyText={EMPTY_TAB_TEXT[activeTab]} />
          )}
        </div>
      </div>
    </>
  );
}
