'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowDownRight, ArrowUpRight, Scale, Wallet } from 'lucide-react';
import { useBilancioStore } from '@/lib/stores/bilancio';
import { Button } from '@/lib/components/shared/ui/Button';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { BilancioSkeleton } from '@/lib/components/admin/bilancio/BilancioSkeleton';
import { BilancioPeriodControl } from '@/lib/components/admin/bilancio/BilancioPeriodControl';
import { KpiCard } from '@/lib/components/admin/bilancio/KpiCard';
import { EntrateUsciteChart } from '@/lib/components/admin/bilancio/EntrateUsciteChart';
import { EntrateCard, UsciteCard } from '@/lib/components/admin/bilancio/BilancioVociCard';
import { TaxSimulatorCard } from '@/lib/components/admin/bilancio/TaxSimulatorCard';

/** Percentage change, or null when there is nothing to compare with. */
function change(current: number, before: number | undefined): number | null {
  if (before === undefined || before <= 0) return null;
  return ((current - before) / before) * 100;
}

/**
 * Profit and loss for any period, computed in the database by public.bilancio():
 * completed fiches at the price charged, package and gift-card sales, costs by P&L line,
 * all shown without VAT with the VAT-inclusive figure alongside.
 */
export function BilancioPanoramicaTab() {
  const router = useRouter();
  const data = useBilancioStore((s) => s.data);
  const previous = useBilancioStore((s) => s.previous);
  const isLoading = useBilancioStore((s) => s.isLoading);
  const error = useBilancioStore((s) => s.error);
  const fetchBilancio = useBilancioStore((s) => s.fetch);
  const [taxRate, setTaxRate] = useState(27);

  useEffect(() => {
    void fetchBilancio();
  }, [fetchBilancio]);

  const vuoto = data && data.entrate.lordo === 0 && data.uscite.lordo === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BilancioPeriodControl />
        {data && (
          <p className="text-xs text-muted-foreground max-w-sm">
            Contano solo le fiche concluse. Gli importi sono senza IVA ({data.iva_pct}%), con l&apos;importo IVA inclusa accanto.
          </p>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-danger-line bg-danger-soft p-4 flex flex-wrap items-center gap-3 text-sm text-danger-strong">
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{error}</span>
          <Button variant="secondary" onClick={() => void fetchBilancio()}>Riprova</Button>
        </div>
      ) : !data ? (
        <BilancioSkeleton />
      ) : vuoto ? (
        <EmptyState
          icon={Wallet}
          title="Nessun movimento in questo periodo"
          description="Le entrate arrivano dalle fiche concluse, le uscite dalle spese. Prova un altro periodo o registra una fiche."
          action={{ label: 'Vai alle fiche', onClick: () => router.push('/admin/fiches') }}
        />
      ) : (
        <div className={`flex flex-col gap-6 transition-opacity ${isLoading ? 'opacity-60' : ''}`} aria-busy={isLoading}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KpiCard label="Entrate" icon={ArrowUpRight} netto={data.entrate.netto} lordo={data.entrate.lordo}
              trend={change(data.entrate.netto, previous?.entrate.netto)} />
            <KpiCard label="Uscite" icon={ArrowDownRight} netto={data.uscite.netto} lordo={data.uscite.lordo}
              trend={change(data.uscite.netto, previous?.uscite.netto)} higherIsWorse />
            <KpiCard label="Utile" icon={Scale} netto={data.utile.netto} lordo={data.utile.lordo}
              trend={change(data.utile.netto, previous?.utile.netto)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              {data.mesi.length > 1 ? (
                <EntrateUsciteChart mesi={data.mesi} />
              ) : (
                <EntrateCard data={data} />
              )}
            </div>
            <TaxSimulatorCard utile={data.utile.netto} taxRate={taxRate} onTaxRateChange={setTaxRate} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {data.mesi.length > 1 && <EntrateCard data={data} />}
            <UsciteCard data={data} />
          </div>
        </div>
      )}
    </div>
  );
}
