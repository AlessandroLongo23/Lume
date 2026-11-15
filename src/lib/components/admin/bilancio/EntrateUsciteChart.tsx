'use client';

import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { makeRechartsTooltip } from '@/lib/components/graphs/RechartsTooltip';
import { AXIS_TICK, CURSOR_FILL, GRID_STROKE, SERIES_PRIMARY, SERIES_SECONDARY, compactEuro } from '@/lib/components/graphs/chartTheme';
import { formatCurrency } from '@/lib/utils/format';
import type { BilancioMese } from '@/lib/types/Bilancio';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

// Validated pair (dataviz palette checker, light + dark): see semantic.css.
const ENTRATE = SERIES_PRIMARY;
const USCITE = SERIES_SECONDARY;

const tooltip = makeRechartsTooltip((v, name) => [formatCurrency(Number(v)), name]);

const meseLabel = (mese: string) => format(parseISO(`${mese}-01`), 'MMM yyyy', { locale: it });

// Outer cells of the month table pad in to the card's p-6.
const EDGE = 'first:pl-6 last:pr-6';


/** Monthly revenue vs costs, both without VAT. One axis (€), grouped columns. */
export function EntrateUsciteChart({ mesi }: { mesi: BilancioMese[] }) {
  const data = mesi.map((m) => ({
    mese: meseLabel(m.mese),
    Entrate: m.entrate_netto,
    Uscite: m.uscite_netto,
  }));

  return (
    <div className="surface-card p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-medium tracking-tight text-[var(--lume-text)]">Entrate e uscite per mese</h3>
          <p className="text-sm text-[var(--lume-text-secondary)] mt-1">Importi in euro, senza IVA</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--lume-text-secondary)]" aria-hidden>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: ENTRATE }} /> Entrate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: USCITE }} /> Uscite
          </span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis
              dataKey="mese"
              axisLine={false}
              tickLine={false}
              tick={AXIS_TICK}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={AXIS_TICK}
              tickFormatter={compactEuro}
            />
            <Tooltip content={tooltip} cursor={CURSOR_FILL} />
            <Bar dataKey="Entrate" fill={ENTRATE} radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="Uscite" fill={USCITE} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="group text-sm">
        <summary className="cursor-pointer select-none text-sm text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] pointer-coarse:py-3">
          Vedi i numeri mese per mese
        </summary>
        {/* Bleeds to the card's edges (-mx-6); the outer cells pad back in so
            the text lines up with the title above. */}
        <div className="-mx-6 mt-3 overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={`${thClass()} ${EDGE}`}>Mese</th>
                <th className={`${thClass({ align: 'right' })} ${EDGE}`}>Entrate</th>
                <th className={`${thClass({ align: 'right' })} ${EDGE}`}>Uscite</th>
                <th className={`${thClass({ align: 'right' })} ${EDGE}`}>Utile</th>
              </tr>
            </thead>
            <tbody className={tbodyClass}>
              {mesi.map((m) => {
                const utile = m.entrate_netto - m.uscite_netto;
                return (
                  <tr key={m.mese} className={trClass({ interactive: false })}>
                    <td className={`${tdClass} ${EDGE}`}>
                      <span className={`${cellStrongClass} capitalize`}>{meseLabel(m.mese)}</span>
                    </td>
                    <td className={`${tdClass} ${EDGE} text-right`}>
                      <span className={cellNumClass}>{formatCurrency(m.entrate_netto)}</span>
                    </td>
                    <td className={`${tdClass} ${EDGE} text-right`}>
                      <span className={cellNumClass}>{formatCurrency(m.uscite_netto)}</span>
                    </td>
                    <td className={`${tdClass} ${EDGE} text-right`}>
                      <span className={`${cellNumClass} ${utile < 0 ? 'text-danger-strong' : 'text-[var(--lume-text)]'}`}>
                        {formatCurrency(utile)}
                      </span>
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
