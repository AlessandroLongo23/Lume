'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, ArrowLeft } from 'lucide-react';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { Button } from '@/lib/components/shared/ui/Button';
import { useProspectsStore } from '@/lib/stores/prospects';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';
import type { Prospect, ProspectStatus } from '@/lib/types/Prospect';
import { applyProspectFilters } from '@/lib/components/platform/prospects/ProspectFilters';
import { SessionRunner } from '@/lib/components/platform/prospects/SessionRunner';

const PROSPECT_STATUS_VALUES = new Set([
  'not_contacted', 'no_answer', 'callback_scheduled', 'not_interested',
  'no_pc', 'interested', 'materials_sent', 'signed_up',
]);

export default function ProspectSessionPage() {
  const searchParams = useSearchParams();
  const prospects     = useProspectsStore((s) => s.prospects);
  const isLoading     = useProspectsStore((s) => s.isLoading);
  const fetchProspects = useProspectsStore((s) => s.fetch);

  const [snapshot, setSnapshot] = useState<Prospect[] | null>(null);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // Realtime — keeps prospect mutations consistent with the list view, but the
  // session queue itself is frozen (snapshot) at session start.
  useRealtimeStore('prospects', fetchProspects);

  // Build the queue exactly once when data is first available.
  useEffect(() => {
    if (snapshot !== null) return;
    if (prospects.length === 0) return;

    const filters = {
      query:   searchParams.get('q') ?? '',
      region:  searchParams.get('region'),
      statuses: (searchParams.getAll('status') as ProspectStatus[])
        .filter((s) => PROSPECT_STATUS_VALUES.has(s)),
    };

    const filtered = applyProspectFilters(prospects, filters);

    // Order: due callbacks first (oldest due first), then by created_at asc.
    const ordered = [...filtered].sort((a, b) => {
      const aCb = a.callback_at ? new Date(a.callback_at).getTime() : Number.POSITIVE_INFINITY;
      const bCb = b.callback_at ? new Date(b.callback_at).getTime() : Number.POSITIVE_INFINITY;
      if (aCb !== bCb) return aCb - bCb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(ordered);
  }, [prospects, snapshot, searchParams]);

  const queue = useMemo(() => snapshot ?? [], [snapshot]);

  if (isLoading && prospects.length === 0) {
    return <TableSkeleton />;
  }

  if (snapshot !== null && queue.length === 0) {
    return (
      <div className="flex flex-1 min-h-0 flex-col">
        <EmptyState
          icon={Building2}
          title="Nessun prospect nei filtri selezionati"
          description="Torna alla lista, regola i filtri e riprova."
          action={{ label: 'Lista prospect', icon: ArrowLeft, onClick: () => { window.location.href = '/platform/prospects'; } }}
        />
      </div>
    );
  }

  if (snapshot === null) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <Link href="/platform/prospects">
          <Button variant="ghost" leadingIcon={ArrowLeft}>Torna alla lista</Button>
        </Link>
      </div>
    );
  }

  return <SessionRunner queue={queue} />;
}
