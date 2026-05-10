import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';
import type { ClientRow } from '../statHelpers';

interface Props { rows: ClientRow[] }

export function TopClientsPreviewTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="text-xs text-zinc-400 px-5 pb-5">Nessun cliente nel periodo.</p>;
  }
  const top5 = rows.slice(0, 5);
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <th className="text-left px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">#</th>
            <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cliente</th>
            <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Presenze</th>
            <th className="text-right px-5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Incasso</th>
          </tr>
        </thead>
        <tbody>
          {top5.map((row, i) => (
            <tr key={row.clientId} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td className="px-5 py-2.5 text-xs text-zinc-400 tabular-nums">{i + 1}</td>
              <td className="px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{row.name}</td>
              <td className="px-3 py-2.5 text-sm text-right tabular-nums text-zinc-600 dark:text-zinc-400">{row.presenze}</td>
              <td className="px-5 py-2.5 text-sm text-right tabular-nums text-zinc-900 dark:text-zinc-50 font-semibold">{formatCurrency(row.incasso)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 5 && (
        <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800">
          <Link href="/admin/statistiche/clienti" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">
            Vedi tutti {rows.length} clienti →
          </Link>
        </div>
      )}
    </div>
  );
}
