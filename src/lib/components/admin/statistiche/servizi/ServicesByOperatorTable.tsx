import { formatCurrency } from '@/lib/utils/format';
import type { OperatorServiceRow } from '../statHelpers';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

interface Props { rows: OperatorServiceRow[] }

export function ServicesByOperatorTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">Nessun dato.</p>;
  }
  return (
    <table className={`${tableClass} min-w-128`}>
      <thead className={theadClass}>
        <tr>
          <th className={`${thClass()} first:pl-5 last:pr-5`}>Operatore</th>
          <th className={`${thClass()} first:pl-5 last:pr-5`}>Servizio</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Numero</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Incasso</th>
        </tr>
      </thead>
      <tbody className={tbodyClass}>
        {rows.map((row, i) => (
          <tr key={i} className={trClass({ interactive: false })}>
            <td className={`${tdClass} ${cellStrongClass} first:pl-5 last:pr-5`}>{row.operatorName}</td>
            <td className={`${tdClass} first:pl-5 last:pr-5`}>{row.serviceName}</td>
            <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.count}</td>
            <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text)] text-right first:pl-5 last:pr-5`}>{formatCurrency(row.incasso)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
