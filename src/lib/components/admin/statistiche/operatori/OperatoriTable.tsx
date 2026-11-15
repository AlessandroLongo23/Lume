import { formatCurrency } from '@/lib/utils/format';
import type { OperatorSummaryRow } from '../statHelpers';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

interface Props { rows: OperatorSummaryRow[] }

export function OperatoriTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">Nessun operatore nel periodo.</p>;
  }
  return (
    <table className={`${tableClass} min-w-128`}>
      <thead className={theadClass}>
        <tr>
          <th className={`${thClass()} first:pl-5 last:pr-5`}>Operatore</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Fiches</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Incasso</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Scontrino medio</th>
          <th className={`${thClass()} first:pl-5 last:pr-5`}>Servizio top</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Clienti</th>
        </tr>
      </thead>
      <tbody className={tbodyClass}>
        {rows.map((row) => (
          <tr key={row.operatorId} className={trClass({ interactive: false })}>
            <td className={`${tdClass} ${cellStrongClass} first:pl-5 last:pr-5`}>{row.name}</td>
            <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.ficheCount}</td>
            <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text)] text-right first:pl-5 last:pr-5`}>{formatCurrency(row.incasso)}</td>
            <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{formatCurrency(row.avgTicket)}</td>
            <td className={`${tdClass} max-w-35 truncate first:pl-5 last:pr-5`}>{row.topService}</td>
            <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.clientCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
