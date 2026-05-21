'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchAllPages } from '@/lib/supabase/paginate';
import { FicheBucket, FICHE_BUCKET_LABELS, BUCKET_STYLES, getFicheBucket } from '@/lib/types/Fiche';
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
    (sum, fp) => sum + (fp.final_price ?? 0) * (fp.quantity ?? 1),
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
      const { data, error: fetchError } = await fetchAllPages<RawFicheRow>((from, to) =>
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
        <div className="size-6 border-2 border-zinc-500/25 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">
        Impossibile caricare lo storico delle fiche.
      </p>
    );
  }

  if (entries!.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-6 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
        <Ticket className="size-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Nessuna fiche per questo cliente</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          Gli appuntamenti del cliente compariranno qui.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--lume-bg)]">
          <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 border-b border-zinc-500/25">
            <th className="text-left font-medium py-2 pr-3 w-32">Data</th>
            <th className="text-left font-medium py-2 pr-3">Servizi</th>
            <th className="text-right font-medium py-2 pr-3 w-28">Totale</th>
            <th className="text-right font-medium py-2 w-28">Stato</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-500/10">
          {entries!.map((e) => (
            <tr
              key={e.id}
              onClick={() => router.push(`/admin/fiches?edit=${e.id}`)}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                {format(e.datetime, 'd MMM yyyy', { locale: it })}
              </td>
              <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-100 max-w-[280px] truncate">
                {e.services || <span className="text-zinc-400">—</span>}
              </td>
              <td className="py-2 pr-3 text-right text-zinc-800 dark:text-zinc-100 whitespace-nowrap tabular-nums">
                {formatCurrency(e.total)}
              </td>
              <td className="py-2 text-right whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${BUCKET_STYLES[e.bucket]}`}
                >
                  {FICHE_BUCKET_LABELS[e.bucket]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
