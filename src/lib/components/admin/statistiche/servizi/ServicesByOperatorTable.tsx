import { formatCurrency } from '@/lib/utils/format';
import type { OperatorServiceRow } from '../statHelpers';

interface Props { rows: OperatorServiceRow[] }

export function ServicesByOperatorTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun dato.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 dark:border-zinc-800">
          <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Operatore</th>
          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Servizio</th>
          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">N.</th>
          <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incasso</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="px-5 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">{row.operatorName}</td>
            <td className="px-3 py-2.5 text-sm text-zinc-600 dark:text-zinc-400">{row.serviceName}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.count}</td>
            <td className="px-5 py-2.5 text-sm text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(row.incasso)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
