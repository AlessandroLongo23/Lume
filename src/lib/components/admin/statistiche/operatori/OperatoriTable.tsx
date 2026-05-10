import { formatCurrency } from '@/lib/utils/format';
import type { OperatorSummaryRow } from '../statHelpers';

interface Props { rows: OperatorSummaryRow[] }

export function OperatoriTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun operatore nel periodo.</p>;
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 dark:border-zinc-800">
          <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Operatore</th>
          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Fiches</th>
          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incasso</th>
          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Scontr. medio</th>
          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Servizio top</th>
          <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Clienti</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.operatorId} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="px-5 py-2.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{row.name}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.ficheCount}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(row.incasso)}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{formatCurrency(row.avgTicket)}</td>
            <td className="px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-[140px] truncate">{row.topService}</td>
            <td className="px-5 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.clientCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
