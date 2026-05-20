'use client';

import { useEffect } from 'react';
import { History } from 'lucide-react';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { ActivityFeed } from '@/lib/components/admin/activity/ActivityFeed';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { useActivityLogStore } from '@/lib/stores/activity_log';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';
import { useRealtimeStore } from '@/lib/hooks/useRealtimeStore';

export default function AttivitaPage() {
  const items = useActivityLogStore((s) => s.activity_log);
  const isLoading = useActivityLogStore((s) => s.isLoading);
  const fetchActivityLog = useActivityLogStore((s) => s.fetchActivityLog);
  const activeSalonId = useWorkspaceStore((s) => s.activeSalonId);

  // The log is only needed on this page, so hydrate lazily on mount.
  useEffect(() => {
    fetchActivityLog();
  }, [fetchActivityLog]);

  // Live feed — refetch the latest slice whenever a row lands for this salon.
  useRealtimeStore('activity_log', fetchActivityLog, activeSalonId);

  // The formatter resolves *_id references to names from these stores; subscribe
  // so the table re-renders the moment any of them finishes hydrating.
  useClientsStore((s) => s.clients.length);
  useOperatorsStore((s) => s.operators.length);
  useServicesStore((s) => s.services.length);
  useProductsStore((s) => s.products.length);
  useServiceCategoriesStore((s) => s.service_categories.length);
  useProductCategoriesStore((s) => s.product_categories.length);
  useManufacturersStore((s) => s.manufacturers.length);
  useSuppliersStore((s) => s.suppliers.length);
  useFichesStore((s) => s.fiches.length);
  useFicheServicesStore((s) => s.fiche_services.length);
  useFicheProductsStore((s) => s.fiche_products.length);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6">
      <PageHeader
        title="Attività"
        subtitle="Tutto ciò che succede nel salone: chi ha fatto cosa, e quando."
        icon={History}
      />

      {isLoading && items.length === 0 ? (
        <TableSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title="Ancora nessuna attività"
          description="Qui comparirà lo storico delle azioni del tuo team: creazioni, modifiche ed eliminazioni."
        />
      ) : (
        <ActivityFeed items={items} />
      )}
    </div>
  );
}
