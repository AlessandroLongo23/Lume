import { formatCurrency } from '@/lib/utils/format';
import type { ClientRow } from '../statHelpers';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

interface Props {
  rows: ClientRow[];
  sortBy?: 'incasso' | 'presenze';
}

export function ClientLeaderboardTable({ rows, sortBy = 'incasso' }: Props) {
  const sorted = [...rows].sort((a, b) =>
    sortBy === 'incasso' ? b.incasso - a.incasso : b.presenze - a.presenze,
  );

  if (sorted.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">Nessun cliente nel periodo.</p>;
  }

  return (
    <table className={`${tableClass} min-w-128`}>
      <thead className={theadClass}>
        <tr>
          <th className={`${thClass()} first:pl-5 last:pr-5`}>#</th>
          <th className={`${thClass()} first:pl-5 last:pr-5`}>Cliente</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Presenze</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Incasso</th>
          <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Scontrino medio</th>
        </tr>
      </thead>
      <tbody className={tbodyClass}>
        {sorted.map((row, i) => (
          <tr key={row.clientId} className={trClass({ interactive: false })}>
            <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text-muted)] first:pl-5 last:pr-5`}>{i + 1}</td>
            <td className={`${tdClass} ${cellStrongClass} first:pl-5 last:pr-5`}>{row.name}</td>
            <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.presenze}</td>
            <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text)] text-right first:pl-5 last:pr-5`}>{formatCurrency(row.incasso)}</td>
            <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{formatCurrency(row.avgTicket)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
