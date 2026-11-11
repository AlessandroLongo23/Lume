import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import type { ClientRow } from '../statHelpers';
import { cellNumClass, cellStrongClass, tableClass, tbodyClass, tdClass, thClass, theadClass, trClass } from '@/lib/components/shared/ui/table/tableStyles';

interface Props { rows: ClientRow[] }

export function TopClientsPreviewTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--lume-text-muted)] px-5 pb-5">Nessun cliente nel periodo.</p>;
  }
  const top5 = rows.slice(0, 5);
  return (
    <div>
      <table className={`${tableClass} min-w-128`}>
        <thead className={theadClass}>
          <tr>
            <th className={`${thClass()} first:pl-5 last:pr-5`}>#</th>
            <th className={`${thClass()} first:pl-5 last:pr-5`}>Cliente</th>
            <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Presenze</th>
            <th className={`${thClass({ align: 'right' })} first:pl-5 last:pr-5`}>Incasso</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          {top5.map((row, i) => (
            <tr key={row.clientId} className={trClass({ interactive: false })}>
              <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text-muted)] first:pl-5 last:pr-5`}>{i + 1}</td>
              <td className={`${tdClass} ${cellStrongClass} first:pl-5 last:pr-5`}>{row.name}</td>
              <td className={`${tdClass} ${cellNumClass} text-right first:pl-5 last:pr-5`}>{row.presenze}</td>
              <td className={`${tdClass} ${cellNumClass} text-[var(--lume-text)] text-right first:pl-5 last:pr-5`}>{formatCurrency(row.incasso)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 5 && (
        <div className="px-5 py-3 border-t border-line">
          <Link href="/admin/statistiche/clienti" className="text-sm text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] transition-colors">
            Vedi tutti {rows.length} clienti →
          </Link>
        </div>
      )}
    </div>
  );
}
