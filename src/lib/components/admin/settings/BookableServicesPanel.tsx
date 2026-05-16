'use client';

import { useEffect, useMemo, useState } from 'react';
import { Globe, Loader2, Scissors } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Service } from '@/lib/types/Service';

export function BookableServicesPanel() {
  const services = useServicesStore((s) => s.services);
  const isLoading = useServicesStore((s) => s.isLoading);
  const updateService = useServicesStore((s) => s.updateService);
  const fetchServices = useServicesStore((s) => s.fetchServices);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const fetchCategories = useServiceCategoriesStore((s) => s.fetchServiceCategories);

  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (services.length === 0) fetchServices();
    if (categories.length === 0) fetchCategories();
  }, [services.length, categories.length, fetchServices, fetchCategories]);

  const visibleServices = useMemo(
    () => services.filter((s) => !s.isArchived).sort((a, b) => a.name.localeCompare(b.name, 'it')),
    [services],
  );

  const bookableCount = visibleServices.filter((s) => s.bookable_online).length;

  const onToggle = async (svc: Service) => {
    setPendingId(svc.id);
    try {
      const updated = await updateService(svc.id, { bookable_online: !svc.bookable_online });
      // Reflect the change immediately in the store so the row flips.
      useServicesStore.setState((s) => ({
        services: s.services.map((it) => (it.id === svc.id ? updated : it)),
      }));
    } catch {
      messagePopup.getState().error('Errore durante l\'aggiornamento del servizio');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <SettingsCard
      icon={Scissors}
      title="Servizi prenotabili online"
      description="Solo i servizi spuntati saranno mostrati nella vetrina pubblica."
      rightSlot={
        <span className="text-xs text-zinc-500 tabular-nums">
          {bookableCount} / {visibleServices.length}
        </span>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="size-4 animate-spin text-zinc-400" />
        </div>
      ) : visibleServices.length === 0 ? (
        <p className="text-sm text-zinc-500">Nessun servizio attivo. Aggiungine uno dalla sezione Servizi.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {visibleServices.map((svc) => {
            const cat = categories.find((c) => c.id === svc.category_id);
            return (
              <li key={svc.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{svc.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 truncate">
                    {cat?.name ?? 'Senza categoria'} · {svc.duration} min · {svc.price.toFixed(2)} €
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {svc.bookable_online && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                      <Globe className="size-3" /> online
                    </span>
                  )}
                  <Switch
                    checked={svc.bookable_online}
                    onChange={() => onToggle(svc)}
                    disabled={pendingId === svc.id}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SettingsCard>
  );
}
