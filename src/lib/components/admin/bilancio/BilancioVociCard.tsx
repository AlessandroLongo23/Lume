import { formatCurrency } from '@/lib/utils/format';
import { SeriesDot } from '@/lib/components/shared/ui/StatRow';
import { SERIES_PRIMARY, SERIES_SECONDARY } from '@/lib/components/graphs/chartTheme';
import { VOCI_ENTRATA, VOCI_USCITA, type BilancioResult, type Importo } from '@/lib/types/Bilancio';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

// The table bleeds to the card's edges (-mx-6) and the outer cells pad back
// in, so the hairlines run edge to edge and the text lines up with the title.
const EDGE = 'first:pl-6 last:pr-6';
// Hairline above the total, the same one the body rows draw.
const TOTAL_CELL = `${tdClass} ${EDGE} shadow-[inset_0_1px_0_var(--lume-line)]`;

function Riga({ label, importo, sub = false }: { label: string; importo: Importo; sub?: boolean }) {
  return (
    <tr className={trClass({ interactive: false })}>
      {/* A category under its heading is indented and stays secondary. */}
      <td className={`${tdClass} ${sub ? 'first:pl-10' : 'first:pl-6'}`}>
        {sub ? label : <span className={cellStrongClass}>{label}</span>}
      </td>
      <td className={`${tdClass} ${EDGE} text-right`}>
        <span className={`${cellNumClass} ${sub ? '' : 'text-[var(--lume-text)]'}`}>{formatCurrency(importo.netto)}</span>
      </td>
      <td className={`${tdClass} ${EDGE} text-right`}>
        <span className={`${cellNumClass} text-[var(--lume-text-muted)]`}>{formatCurrency(importo.lordo)}</span>
      </td>
    </tr>
  );
}

function Tabella({ titolo, colore, totale, children }: { titolo: string; colore: string; totale: Importo; children: React.ReactNode }) {
  return (
    <div className="surface-card p-6 flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-base font-medium tracking-tight text-[var(--lume-text)]">
        <SeriesDot color={colore} />
        {titolo}
      </h3>
      <div className="-mx-6 overflow-x-auto">
        <table className={tableClass}>
          <thead className={theadClass}>
            <tr>
              <th className={`${thClass()} ${EDGE}`}>Voce</th>
              <th className={`${thClass({ align: 'right' })} ${EDGE}`}>Senza IVA</th>
              <th className={`${thClass({ align: 'right' })} ${EDGE}`}>Con IVA</th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>{children}</tbody>
          <tfoot>
            <tr>
              <td className={TOTAL_CELL}>
                <span className={cellStrongClass}>Totale</span>
              </td>
              <td className={`${TOTAL_CELL} text-right`}>
                <span className={`${cellNumClass} ${cellStrongClass}`}>{formatCurrency(totale.netto)}</span>
              </td>
              <td className={`${TOTAL_CELL} text-right`}>
                <span className={`${cellNumClass} text-[var(--lume-text-muted)]`}>{formatCurrency(totale.lordo)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

const ZERO: Importo = { lordo: 0, netto: 0 };

export function EntrateCard({ data }: { data: BilancioResult }) {
  const voci = data.entrate.voci;
  return (
    <Tabella titolo="Entrate" colore={SERIES_PRIMARY} totale={data.entrate}>
      {VOCI_ENTRATA
        // services and products always show; packages, gift cards and discounts only when present
        .filter((v) => v.key === 'servizi' || v.key === 'prodotti' || voci[v.key])
        .map((v) => <Riga key={v.key} label={v.label} importo={voci[v.key] ?? ZERO} />)}
    </Tabella>
  );
}

export function UsciteCard({ data }: { data: BilancioResult }) {
  const voci = VOCI_USCITA.filter((v) => data.uscite.voci[v.key]);
  if (voci.length === 0) {
    return (
      <div className="surface-card p-6 flex flex-col gap-2">
        <h3 className="flex items-center gap-2 text-base font-medium tracking-tight text-[var(--lume-text)]">
          <SeriesDot color={SERIES_SECONDARY} />
          Uscite
        </h3>
        <p className="text-sm text-[var(--lume-text-secondary)]">
          Nessuna spesa registrata in questo periodo. Le spese si aggiungono dalla scheda Spese.
        </p>
      </div>
    );
  }
  return (
    <Tabella titolo="Uscite" colore={SERIES_SECONDARY} totale={data.uscite}>
      {voci.map((v) => (
        <FragmentVoce key={v.key} label={v.label} importo={data.uscite.voci[v.key]!}
          categorie={data.uscite.categorie.filter((c) => c.voce === v.key)} />
      ))}
    </Tabella>
  );
}

function FragmentVoce({ label, importo, categorie }: {
  label: string; importo: Importo; categorie: { categoria: string; lordo: number; netto: number }[];
}) {
  // a heading with a single category of the same name adds nothing: show one row
  const soloSeStessa = categorie.length === 1 && categorie[0].categoria.toLowerCase() === label.toLowerCase();
  return (
    <>
      <Riga label={label} importo={importo} />
      {!soloSeStessa && categorie.map((c) => (
        <Riga key={c.categoria} label={c.categoria} importo={c} sub />
      ))}
    </>
  );
}
