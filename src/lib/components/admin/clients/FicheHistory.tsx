'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { FicheBucket, FICHE_BUCKET_LABELS, getFicheBucket } from '@/lib/types/Fiche';
import { FICHE_BUCKET_TONE } from '@/lib/components/admin/fiches/ficheBucketTone';
import { tableClass, thClass, trClass, tdClass, cellNumClass, CellEmpty } from '@/lib/components/shared/ui/table/tableStyles';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import type { FicheStatus } from '@/lib/types/ficheStatus';
import { formatCurrency } from '@/lib/utils/format';

interface FicheHistoryProps {
  clientId: string;
}

/** Raw shape returned by the all-time per-client query (line items embedded). */
interface RawFicheRow {
  id: string;
  datetime: string;
  status: FicheStatus;
  total_override: number | null;
  fiche_services: { name: string | null; final_price: number | null }[];
  fiche_products: { final_price: number | null; quantity: number | null }[];
}

interface HistoryEntry {
  id: string;
  datetime: Date;
  bucket: FicheBucket;
  services: string;
  total: number;
}

function toEntry(row: RawFicheRow): HistoryEntry {
  const servicesTotal = row.fiche_services.reduce((sum, fs) => sum + (fs.final_price ?? 0), 0);
  const productsTotal = row.fiche_products.reduce(
    (sum, fp) => sum + (fp.final_price ?? 0),
    0,
  );
  const services = row.fiche_services
    .map((fs) => fs.name?.trim())
    .filter((n): n is string => !!n)
    .join(', ');
  return {
    id: row.id,
    datetime: new Date(row.datetime),
    bucket: getFicheBucket({ datetime: row.datetime, status: row.status }),
    services,
    total: row.total_override ?? servicesTotal + productsTotal,
  };
}

/** Result tagged with the client it was loaded for, so a `clientId` change
 *  reads as "loading" without a synchronous reset inside the effect. */
interface LoadState {
  clientId: string;
  entries: HistoryEntry[] | null;
  error: string | null;
}

export function FicheHistory({ clientId }: FicheHistoryProps) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ clientId: '', entries: null, error: null });

  // Fetch the client's complete fiche history directly — the in-memory
  // fiches store only holds the last 90 days, so we cannot read it here.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fetchError } = await fetchAllPages((from, to) =>
        supabase
          .from('fiches')
          // `fiche_services` has two FKs to fiches.id on the same column (a
          // legacy `fish_services_fish_id_fkey` duplicate), so the embed must
          // name the constraint or PostgREST returns 300 Multiple Choices.
          .select(
            'id, datetime, status, total_override, fiche_services!fiche_services_fiche_id_fkey(name, final_price), fiche_products(final_price, quantity)',
          )
          .eq('client_id', clientId)
          .order('datetime', { ascending: false })
          .range(from, to),
      );
      if (cancelled) return;
      setState({
        clientId,
        entries: fetchError ? null : data.map(toEntry),
        error: fetchError,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const ready = state.clientId === clientId;
  const entries = ready ? state.entries : null;
  const error = ready ? state.error : null;

  if (entries === null && !error) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="size-6 border-2 border-active border-t-[var(--lume-text-secondary)] rounded-full animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-[var(--lume-text-muted)]">
        Impossibile caricare lo storico delle fiche.
      </p>
    );
  }

  if (entries!.length === 0) {
    return (
      <div className="flex items-center gap-3 py-4 shadow-[inset_0_1px_0_var(--lume-line),inset_0_-1px_0_var(--lume-line)]">
        <Ticket className="size-4 shrink-0 text-[var(--lume-text-muted)]" aria-hidden />
        <div>
          <p className="text-sm text-[var(--lume-text)]">Nessuna fiche per questo cliente</p>
          <p className="text-xs text-[var(--lume-text-secondary)] mt-0.5">
            Gli appuntamenti del cliente compariranno qui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-105 overflow-auto -mx-4">
      <table className={tableClass}>
        <thead className="sticky top-0 z-sticky bg-[var(--lume-panel)]">
          <tr>
            <th className={`${thClass()} w-36`}>Data</th>
            <th className={thClass()}>Servizi</th>
            <th className={`${thClass({ align: 'right' })} w-28`}>Totale</th>
            <th className={`${thClass()} w-32`}>Stato</th>
          </tr>
        </thead>
        <tbody>
          {entries!.map((e) => (
            <tr
              key={e.id}
              onClick={() => router.push(`/admin/fiches?edit=${e.id}`)}
              className={trClass()}
            >
              <td className={tdClass}>
                <span className={cellNumClass}>{format(e.datetime, 'dd/MM/yyyy', { locale: it })}</span>
              </td>
              <td className={`${tdClass} text-[var(--lume-text)] max-w-70 truncate`}>
                {e.services || <CellEmpty />}
              </td>
              <td className={`${tdClass} text-right`}>
                <span className={cellNumClass}>{formatCurrency(e.total)}</span>
              </td>
              <td className={tdClass}>
                <StatusDot tone={FICHE_BUCKET_TONE[e.bucket]}>{FICHE_BUCKET_LABELS[e.bucket]}</StatusDot>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
