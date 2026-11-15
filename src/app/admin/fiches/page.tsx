'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ticket, TableProperties, LayoutGrid, Calendar, FileDown, ArrowDownToLine, Trash2 } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { initialLoadedFrom } from '@/lib/stores/ficheWindowStart';
import { useEnsureFichesLoadedFrom } from '@/lib/stores/ficheWindow';
import { Select } from '@/lib/components/shared/ui/forms/Select';

import { loadFicheById } from '@/lib/stores/loadFicheById';
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
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';
import type { Fiche } from '@/lib/types/Fiche';
import { useViewsStore } from '@/lib/stores/views';
import { useOrderedTabs } from '@/lib/hooks/useOrderedTabs';
import { TAB_DEFAULTS, TAB_LABELS } from '@/lib/const/tab-defaults';

type TabValue = 'prenotate' | 'arretrate' | 'concluse' | 'tutte';

type Periodo = 'recenti' | 'anno' | 'tutto';
const PERIODO_LABELS: Record<Periodo, string> = {
  recenti: 'Ultimi 3 mesi',
  anno: 'Ultimo anno',
  tutto: 'Tutto lo storico',
};
const PERIODO_OPTIONS = (Object.keys(PERIODO_LABELS) as Periodo[]).map((value) => ({ value, label: PERIODO_LABELS[value] }));

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
  const [periodo, setPeriodo] = useState<Periodo>('recenti');
  const isLoadingOlder = useFichesStore((s) => s.isLoadingOlder);
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
      if (fiche) {
        setCommandTarget(fiche);
        setCommandMode('edit');
      } else {
        // Deep-linked fiche older than the 90-day window (e.g. from a client's
        // Storico fiche). Hydrate it on demand, then open the modal.
        loadFicheById(editId).then((f) => {
          if (f) {
            setCommandTarget(f);
            setCommandMode('edit');
          }
        });
      }
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

  // The app loads the last 90 days at startup: older periods load when chosen here.
  const periodFrom = useMemo(() => {
    if (periodo === 'tutto') return new Date(2000, 0, 1);
    if (periodo === 'anno') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return initialLoadedFrom();
  }, [periodo]);
  useEnsureFichesLoadedFrom(periodFrom);

  const fichesWithBucket = useMemo(
    () => fiches
      .filter((f) => !f.datetime || new Date(f.datetime) >= periodFrom)
      .map((f) => ({ fiche: f, bucket: getFicheBucket(f) })),
    [fiches, periodFrom]
  );

  const counts = useMemo(() => {
    const c = { prenotate: 0, arretrate: 0, concluse: 0, tutte: fichesWithBucket.length };
    for (const { bucket } of fichesWithBucket) {
      if (bucket === FicheBucket.PRENOTATA) c.prenotate++;
      else if (bucket === FicheBucket.ARRETRATA) c.arretrate++;
      else if (bucket === FicheBucket.CONCLUSA) c.concluse++;
    }
    return c;
  }, [fichesWithBucket]);

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

      <div data-tour="fiches-page" className="flex-1 min-h-0 flex flex-col gap-6">
        <PageHeader
          title="Fiches"
          subtitle="La storia di ogni visita, dal check-in al saldo."
          actions={
            <>
              <ToggleButton
                ariaLabel="Vista"
                value={view}
                onChange={setView}
                options={['table', 'grid']}
                labels={['Tabella', 'Griglia']}
                icons={[TableProperties, LayoutGrid]}
              />
              <Button
                data-tour="action-fiche-create"
                variant="primary"
                leadingIcon={Ticket}
                onClick={() => setShowAdd(true)}
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

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <TabBar label="Stato delle fiche">
              {visible.map((id) => (
                <TabButton key={id} active={activeTab === id} count={counts[id]} onClick={() => setActiveTab(id)}>
                  {TAB_LABELS.fiches[id]}
                </TabButton>
              ))}
            </TabBar>
            <div className="ml-auto flex items-center gap-3">
              {isLoadingOlder && (
                <span className="text-xs text-[var(--lume-text-secondary)]" aria-live="polite">Carico le fiche…</span>
              )}
              <Select
                value={periodo}
                onChange={(v: Periodo) => setPeriodo(v)}
                options={PERIODO_OPTIONS}
                labelKey="label"
                valueKey="value"
                searchable={false}
                ariaLabel="Periodo delle fiche"
                className="w-44"
              />
            </div>
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
