'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { NotebookText } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

interface TreatmentHistoryProps {
  clientId: string;
}

export function TreatmentHistory({ clientId }: TreatmentHistoryProps) {
  const router = useRouter();
  const fiches = useFichesStore((s) => s.fiches);

  const entries = useMemo(
    () =>
      fiches
        .filter((f) => f.client_id === clientId && f.hasTreatmentData())
        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()),
    [fiches, clientId],
  );

  if (entries.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-6 border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
        <NotebookText className="size-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Nessuno storico trattamenti</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          I trattamenti compilati nelle fiche compariranno qui.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 border-b border-zinc-500/25">
            <th className="text-left font-medium py-2 pr-3 w-32">Data</th>
            <th className="text-left font-medium py-2 pr-3">Miscela</th>
            <th className="text-left font-medium py-2 pr-3">Tecnica</th>
            <th className="text-left font-medium py-2">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-500/10">
          {entries.map((f) => (
            <tr
              key={f.id}
              onClick={() => router.push(`/admin/fiches?edit=${f.id}`)}
              className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-200 whitespace-nowrap">
                {format(new Date(f.datetime), 'd MMM yyyy', { locale: it })}
              </td>
              <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-100">
                {f.miscela?.trim() || <span className="text-zinc-400">—</span>}
              </td>
              <td className="py-2 pr-3 text-zinc-800 dark:text-zinc-100">
                {f.tecnica?.trim() || <span className="text-zinc-400">—</span>}
              </td>
              <Tooltip label={f.note || undefined}>
                <td className="py-2 text-zinc-600 dark:text-zinc-300 max-w-[260px] truncate">
                  {f.note?.trim() || <span className="text-zinc-400">—</span>}
                </td>
              </Tooltip>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
