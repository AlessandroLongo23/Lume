'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, PhoneCall, Building2, Search } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { Button } from '@/lib/components/shared/ui/Button';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { useProspectsStore } from '@/lib/stores/prospects';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Prospect, ProspectStatus } from '@/lib/types/Prospect';
import { CALLABLE_STATUSES } from '@/lib/types/Prospect';
import { ProspectsTable, useProspectColumns } from '@/lib/components/platform/prospects/ProspectsTable';
import { ProspectFormModal }    from '@/lib/components/platform/prospects/ProspectFormModal';
import { ProspectStatusDonut }  from '@/lib/components/platform/prospects/ProspectStatusDonut';
import { ColumnPicker }         from '@/lib/components/admin/table/ColumnPicker';
import {
  ProspectFilters,
  EMPTY_FILTERS,
  applyProspectFilters,
  type ProspectFiltersValue,
} from '@/lib/components/platform/prospects/ProspectFilters';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';

const PROSPECT_STATUS_VALUES = new Set([
  'not_contacted', 'no_answer', 'callback_scheduled', 'not_interested',
  'no_pc', 'interested', 'materials_sent', 'signed_up',
]);

function readFiltersFromUrl(params: URLSearchParams): ProspectFiltersValue {
  const statuses = (params.getAll('status') as ProspectStatus[])
    .filter((s) => PROSPECT_STATUS_VALUES.has(s));
  return {
    query:    params.get('q') ?? '',
    region:   params.get('region') ?? null,
    statuses,
  };
}

function writeFiltersToUrl(filters: ProspectFiltersValue): string {
  const params = new URLSearchParams();
  if (filters.query.trim())  params.set('q', filters.query.trim());
  if (filters.region)        params.set('region', filters.region);
  for (const s of filters.statuses) params.append('status', s);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function ProspectsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const prospects = useProspectsStore((s) => s.prospects);
  const isLoading = useProspectsStore((s) => s.isLoading);
  const fetchProspects = useProspectsStore((s) => s.fetch);
  const removeProspect = useProspectsStore((s) => s.remove);

  const prospectColumns = useProspectColumns();

  const [filters, setFilters] = useState<ProspectFiltersValue>(EMPTY_FILTERS);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editing,   setEditing]   = useState<Prospect | null>(null);
  const [deleting,  setDeleting]  = useState<Prospect | null>(null);

  // Hydrate filters from URL on mount
  useEffect(() => {
    setFilters(readFiltersFromUrl(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters → URL
  useEffect(() => {
    router.replace(`/platform/prospects${writeFiltersToUrl(filters)}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Realtime — re-fetch on any change to the table
  const onRealtime = useCallback(() => { fetchProspects(); }, [fetchProspects]);
  useRealtimeStore('prospects', onRealtime);

  const filtered = useMemo(
    () => applyProspectFilters(prospects, filters),
    [prospects, filters],
  );

  const toggleStatus = (s: ProspectStatus) => {
    setFilters((f) => ({
      ...f,
      statuses: f.statuses.includes(s) ? f.statuses.filter((x) => x !== s) : [...f.statuses, s],
    }));
  };

  const callableFiltered = useMemo(
    () => applyProspectFilters(prospects, { ...filters, statuses: CALLABLE_STATUSES }),
    [prospects, filters],
  );

  const startSession = () => {
    router.push(`/platform/prospects/session${writeFiltersToUrl({ ...filters, statuses: CALLABLE_STATUSES })}`);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await removeProspect(deleting.id);
      messagePopup.getState().success('Prospect eliminato');
      setDeleting(null);
      if (editing?.id === deleting.id) setEditing(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore: ' + msg);
    }
  };

  const hasFilters = !!(filters.query.trim() || filters.region || filters.statuses.length > 0);

  return (
    <>
      <ProspectFormModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
      />
      <ProspectFormModal
        isOpen={editing !== null}
        prospect={editing}
        onClose={() => setEditing(null)}
        onDeleteRequest={(p) => setDeleting(p)}
      />
      <DeleteModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Elimina prospect"
        subtitle="Questa azione è irreversibile"
      >
        Stai per eliminare <strong>{deleting?.name}</strong>. Continuare?
      </DeleteModal>

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <PageHeader
          title="Prospect"
          subtitle="Gestisci le chiamate commerciali ai saloni italiani."
          icon={Building2}
          actions={
            <>
              <Button
                variant="secondary"
                leadingIcon={PhoneCall}
                onClick={startSession}
                disabled={callableFiltered.length === 0}
              >
                Avvia sessione
              </Button>
              <Button
                variant="primary"
                leadingIcon={Plus}
                onClick={() => setShowAdd(true)}
              >
                Nuovo prospect
              </Button>
            </>
          }
        />

        {isLoading && prospects.length === 0 ? (
          <TableSkeleton />
        ) : prospects.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nessun prospect ancora"
            description="Aggiungi il primo salone da chiamare per iniziare a tracciare le tue cold call."
            action={{ label: 'Nuovo prospect', icon: Plus, onClick: () => setShowAdd(true) }}
          />
        ) : (
          <>
            <ProspectStatusDonut
              prospects={filtered}
              activeStatuses={filters.statuses}
              onToggleStatus={toggleStatus}
            />

            <ProspectFilters
              value={filters}
              onChange={setFilters}
              prospects={prospects}
              trailing={<ColumnPicker tableId="prospects" columns={prospectColumns} />}
            />

            {filtered.length === 0 ? (
              hasFilters ? (
                <EmptyState
                  icon={Search}
                  title="Nessun prospect corrisponde ai filtri"
                  description="Prova a modificare la ricerca o azzerare i filtri."
                  action={{ label: 'Azzera filtri', icon: Search, onClick: () => setFilters(EMPTY_FILTERS) }}
                />
              ) : null
            ) : (
              <ProspectsTable
                prospects={filtered}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
