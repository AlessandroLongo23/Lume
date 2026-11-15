'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { NotebookText } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { tableClass, thClass, trClass, tdClass, cellNumClass, CellEmpty } from '@/lib/components/shared/ui/table/tableStyles';

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
      <div className="flex items-center gap-3 py-4 shadow-[inset_0_1px_0_var(--lume-line),inset_0_-1px_0_var(--lume-line)]">
        <NotebookText className="size-4 shrink-0 text-[var(--lume-text-muted)]" aria-hidden />
        <div>
          <p className="text-sm text-[var(--lume-text)]">Nessuno storico trattamenti</p>
          <p className="text-xs text-[var(--lume-text-secondary)] mt-0.5">
            I trattamenti compilati nelle fiche compariranno qui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto -mx-4">
      <table className={tableClass}>
        <thead>
          <tr>
            <th className={`${thClass()} w-36`}>Data</th>
            <th className={thClass()}>Miscela</th>
            <th className={thClass()}>Tecnica</th>
            <th className={thClass()}>Note</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((f) => (
            <tr
              key={f.id}
              onClick={() => router.push(`/admin/fiches?edit=${f.id}`)}
              className={trClass()}
            >
              <td className={tdClass}>
                <span className={cellNumClass}>{format(new Date(f.datetime), 'dd/MM/yyyy', { locale: it })}</span>
              </td>
              <td className={`${tdClass} whitespace-normal text-[var(--lume-text)]`}>
                {f.miscela?.trim() || <CellEmpty />}
              </td>
              <td className={`${tdClass} whitespace-normal text-[var(--lume-text)]`}>
                {f.tecnica?.trim() || <CellEmpty />}
              </td>
              <Tooltip label={f.note || undefined}>
                <td className={`${tdClass} max-w-65 truncate`}>
                  {f.note?.trim() || <CellEmpty />}
                </td>
              </Tooltip>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
