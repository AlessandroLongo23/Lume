import { formatCurrency } from '@/lib/utils/format';
import type { ClientRow } from '../statHelpers';

interface Props {
  rows: ClientRow[];
  sortBy?: 'incasso' | 'presenze';
}

export function ClientLeaderboardTable({ rows, sortBy = 'incasso' }: Props) {
  const sorted = [...rows].sort((a, b) =>
    sortBy === 'incasso' ? b.incasso - a.incasso : b.presenze - a.presenze,
  );

  if (sorted.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun cliente nel periodo.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-100 dark:border-zinc-800">
          <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">#</th>
          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cliente</th>
          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Presenze</th>
          <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incasso</th>
          <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Scontrino medio</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, i) => (
          <tr key={row.clientId} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
            <td className="px-5 py-2.5 text-xs text-zinc-400 tabular-nums">{i + 1}</td>
            <td className="px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{row.name}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.presenze}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{formatCurrency(row.incasso)}</td>
            <td className="px-5 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{formatCurrency(row.avgTicket)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
