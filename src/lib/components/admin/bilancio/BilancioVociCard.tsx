import { formatCurrency } from '@/lib/utils/format';
import { VOCI_ENTRATA, VOCI_USCITA, type BilancioResult, type Importo } from '@/lib/types/Bilancio';

function Riga({ label, importo, sub = false }: { label: string; importo: Importo; sub?: boolean }) {
  return (
    <tr className={sub ? 'text-muted-foreground' : 'text-foreground'}>
      <td className={`py-2 pr-4 ${sub ? 'pl-4 text-xs' : 'font-medium'}`}>{label}</td>
      <td className={`py-2 pr-4 text-right font-mono tabular-nums ${sub ? 'text-xs' : ''}`}>{formatCurrency(importo.netto)}</td>
      <td className={`py-2 text-right font-mono tabular-nums ${sub ? 'text-xs' : 'text-muted-foreground'}`}>{formatCurrency(importo.lordo)}</td>
    </tr>
  );
}

function Tabella({ titolo, totale, children }: { titolo: string; totale: Importo; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-3">
      <h3 className="text-base font-semibold text-foreground">{titolo}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-4 font-medium">Voce</th>
              <th className="py-1.5 pr-4 font-medium text-right">Senza IVA</th>
              <th className="py-1.5 font-medium text-right">Con IVA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
          <tfoot>
            <tr className="border-t border-border text-foreground">
              <td className="pt-3 pr-4 font-semibold">Totale</td>
              <td className="pt-3 pr-4 text-right font-mono font-semibold tabular-nums">{formatCurrency(totale.netto)}</td>
              <td className="pt-3 text-right font-mono tabular-nums text-muted-foreground">{formatCurrency(totale.lordo)}</td>
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
    <Tabella titolo="Entrate" totale={data.entrate}>
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
      <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">Uscite</h3>
        <p className="text-sm text-muted-foreground">
          Nessuna spesa registrata in questo periodo. Le spese si aggiungono dalla scheda Spese.
        </p>
      </div>
    );
  }
  return (
    <Tabella titolo="Uscite" totale={data.uscite}>
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
