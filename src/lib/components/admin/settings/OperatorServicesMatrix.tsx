'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { useServicesStore } from '@/lib/stores/services';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useOperatorServicesStore } from '@/lib/stores/operatorServices';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

export function OperatorServicesMatrix() {
  const services = useServicesStore((s) => s.services);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const operators = useOperatorsStore((s) => s.operators);
  const fetchOperators = useOperatorsStore((s) => s.fetchOperators);
  const items = useOperatorServicesStore((s) => s.items);
  const isLoading = useOperatorServicesStore((s) => s.isLoading);
  const isLoaded = useOperatorServicesStore((s) => s.isLoaded);
  const fetchItems = useOperatorServicesStore((s) => s.fetchItems);
  const setEligibility = useOperatorServicesStore((s) => s.setEligibility);

  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (services.length === 0) fetchServices();
    if (operators.length === 0) fetchOperators();
    if (!isLoaded) fetchItems();
  }, [services.length, operators.length, isLoaded, fetchServices, fetchOperators, fetchItems]);

  const bookableServices = useMemo(
    () => services.filter((s) => !s.isArchived && s.bookable_online).sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [services],
  );

  const activeOperators = useMemo(
    () => operators.filter((o) => !o.isArchived).sort((a, b) => a.getFullName().localeCompare(b.getFullName(), 'it')),
    [operators],
  );

  // Map: serviceId -> Set<operatorId>. Empty set = "anyone can do this service".
  const eligibility = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const it of items) {
      if (!map.has(it.service_id)) map.set(it.service_id, new Set());
      map.get(it.service_id)!.add(it.operator_id);
    }
    return map;
  }, [items]);

  const onCellToggle = async (serviceId: string, operatorId: string, currentlyAllowed: boolean) => {
    const key = `${serviceId}:${operatorId}`;
    setPending(key);
    try {
      await setEligibility(serviceId, operatorId, !currentlyAllowed);
    } catch (err) {
      messagePopup.getState().error(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento');
    } finally {
      setPending(null);
    }
  };

  return (
    <SettingsCard
      icon={Users}
      title="Chi può svolgere quale servizio"
      description="Spunta le caselle per limitare un servizio agli operatori che lo eseguono. Lascia una riga vuota per dire «chiunque»."
    >
      {isLoading && !isLoaded ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="size-4 animate-spin text-zinc-400" />
        </div>
      ) : bookableServices.length === 0 || activeOperators.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {bookableServices.length === 0
            ? 'Attiva almeno un servizio come prenotabile online per popolare la matrice.'
            : 'Aggiungi almeno un operatore attivo dal pannello Operatori.'}
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Servizio
                </th>
                {activeOperators.map((op) => (
                  <th key={op.id} className="px-2 py-2 text-center text-[11px] font-medium text-zinc-600 dark:text-zinc-300 align-bottom">
                    <span className="block max-w-[6rem] truncate" title={op.getFullName()}>
                      {op.firstName}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {bookableServices.map((svc) => {
                const opSet = eligibility.get(svc.id);
                const everyoneFallback = !opSet || opSet.size === 0;
                return (
                  <tr key={svc.id}>
                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-col min-w-[10rem]">
                        <span className="font-medium truncate" title={svc.name}>{svc.name}</span>
                        {everyoneFallback && (
                          <span className="text-[11px] text-zinc-500">Chiunque</span>
                        )}
                      </div>
                    </td>
                    {activeOperators.map((op) => {
                      const allowed = opSet?.has(op.id) ?? false;
                      const key = `${svc.id}:${op.id}`;
                      const pendingThis = pending === key;
                      return (
                        <td key={op.id} className="text-center py-2 px-2">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={allowed}
                            aria-label={`${op.getFullName()} svolge ${svc.name}`}
                            onClick={() => onCellToggle(svc.id, op.id, allowed)}
                            disabled={pendingThis}
                            className={`relative inline-flex items-center justify-center size-7 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                              allowed
                                ? 'border-primary bg-primary/15 text-primary-hover'
                                : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                            } ${pendingThis ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                          >
                            {allowed && <span className="size-2 rounded-full bg-primary" aria-hidden />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SettingsCard>
  );
}
