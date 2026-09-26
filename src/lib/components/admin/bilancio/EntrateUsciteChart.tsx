'use client';

import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { formatCurrency } from '@/lib/utils/format';
import type { BilancioMese } from '@/lib/types/Bilancio';

// Validated pair (dataviz palette checker, light + dark): see semantic.css.
const ENTRATE = 'var(--lume-chart-entrate)';
const USCITE = 'var(--lume-chart-uscite)';

const tooltip = makeRechartsTooltip((v, name) => [formatCurrency(Number(v)), name]);

const meseLabel = (mese: string) => format(parseISO(`${mese}-01`), 'MMM yyyy', { locale: it });

// axis ticks stay on one line: "16,5k"; the subtitle says the unit is euro
const compactEuro = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}k` : `${v}`;

/** Monthly revenue vs costs, both without VAT. One axis (€), grouped columns. */
export function EntrateUsciteChart({ mesi }: { mesi: BilancioMese[] }) {
  const data = mesi.map((m) => ({
    mese: meseLabel(m.mese),
    Entrate: m.entrate_netto,
    Uscite: m.uscite_netto,
  }));

  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Entrate e uscite per mese</h3>
          <p className="text-xs text-muted-foreground">Importi in euro, senza IVA</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: ENTRATE }} /> Entrate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: USCITE }} /> Uscite
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--lume-border)" strokeWidth={1} />
            <XAxis
              dataKey="mese"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'var(--lume-text-muted)' }}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={40}
              tick={{ fontSize: 11, fill: 'var(--lume-text-muted)' }}
              tickFormatter={compactEuro}
            />
            <Tooltip content={tooltip} cursor={{ fill: 'var(--lume-border)', opacity: 0.35 }} />
            <Bar dataKey="Entrate" fill={ENTRATE} radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="Uscite" fill={USCITE} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="group text-sm">
        <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
          Vedi i numeri mese per mese
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1.5 pr-4 font-medium">Mese</th>
                <th className="py-1.5 pr-4 font-medium text-right">Entrate</th>
                <th className="py-1.5 pr-4 font-medium text-right">Uscite</th>
                <th className="py-1.5 font-medium text-right">Utile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mesi.map((m) => {
                const utile = m.entrate_netto - m.uscite_netto;
                return (
                  <tr key={m.mese}>
                    <td className="py-1.5 pr-4 text-foreground capitalize">{meseLabel(m.mese)}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{formatCurrency(m.entrate_netto)}</td>
                    <td className="py-1.5 pr-4 text-right font-mono">{formatCurrency(m.uscite_netto)}</td>
                    <td className={`py-1.5 text-right font-mono ${utile < 0 ? 'text-danger-strong' : 'text-foreground'}`}>
                      {formatCurrency(utile)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
