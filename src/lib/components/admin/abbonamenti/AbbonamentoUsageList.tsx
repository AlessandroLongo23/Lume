'use client';

import { useMemo } from 'react';
import { Clock, User as UserIcon } from 'lucide-react';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFichesStore } from '@/lib/stores/fiches';
import { useServicesStore } from '@/lib/stores/services';
import { useOperatorsStore } from '@/lib/stores/operators';
import type { Abbonamento } from '@/lib/types/Abbonamento';

interface AbbonamentoUsageListProps {
  abbonamento: Abbonamento;
}

export function AbbonamentoUsageList({ abbonamento }: AbbonamentoUsageListProps) {
  const fiche_services = useFicheServicesStore((s) => s.fiche_services);
  const fiches = useFichesStore((s) => s.fiches);
  const services = useServicesStore((s) => s.services);
  const operators = useOperatorsStore((s) => s.operators);

  const rows = useMemo(() => {
    return fiche_services
      .filter((fs) => fs.abbonamento_id === abbonamento.id)
      .map((fs) => {
        const fiche = fiches.find((f) => f.id === fs.fiche_id);
        const service = services.find((s) => s.id === fs.service_id);
        const operator = operators.find((o) => o.id === fs.operator_id);
        return {
          id: fs.id,
          when: fs.start_time,
          serviceName: service?.name ?? 'Servizio sconosciuto',
          operatorName: operator ? `${operator.firstName} ${operator.lastName}` : '—',
          ficheStatus: fiche?.status ?? 'created',
        };
      })
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  }, [fiche_services, fiches, services, operators, abbonamento.id]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        <Clock className="size-3.5" />
        Sedute utilizzate ({rows.length})
      </div>
      {rows.length === 0 ? (
        <p className="rounded-md border border-zinc-500/15 px-3 py-4 text-center text-xs text-zinc-400">
          Nessuna seduta ancora utilizzata.
        </p>
      ) : (
        <div className="rounded-md border border-zinc-500/15 divide-y divide-zinc-500/10 max-h-48 overflow-y-auto">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div className="flex flex-col min-w-0">
                <span className="truncate text-zinc-900 dark:text-zinc-100">{r.serviceName}</span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <UserIcon className="size-3" />{r.operatorName}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xs text-zinc-500 font-mono">
                  {new Date(r.when).toLocaleDateString('it-IT')}
                </span>
                {r.ficheStatus !== 'completed' && (
                  <span className="text-[10px] text-amber-500 uppercase">In sospeso</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
