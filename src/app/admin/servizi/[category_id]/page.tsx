'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Archive, ArchiveRestore, FolderX, Loader2 } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { Button } from '@/lib/components/shared/ui/Button';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import type { ServiceCategory } from '@/lib/types/ServiceCategory';

export default function ServiceCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const archiveCategory = useServiceCategoriesStore((s) => s.archiveServiceCategory);
  const restoreCategory = useServiceCategoriesStore((s) => s.restoreServiceCategory);
  const services = useServicesStore((s) => s.services);
  const isLoading = useServiceCategoriesStore((s) => s.isLoading);

  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const categoryId = params.category_id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = categories.find((c) => c.id === categoryId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setCategory(found);
    }
  }, [categories, categoryId, isLoading]);

  const categoryServices = useMemo(() =>
    services.filter((s) => s.category_id === categoryId),
    [services, categoryId]
  );

  const handleToggleArchive = async () => {
    if (!category) return;
    try {
      if (category.isArchived) {
        await restoreCategory(category.id);
        messagePopup.getState().success('Categoria ripristinata.');
      } else {
        await archiveCategory(category.id);
        messagePopup.getState().success('Categoria archiviata.');
        router.push('/admin/servizi');
      }
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 aria-label="Caricamento" className="size-6 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  if (!category) {
    return (
      <EmptyState
        icon={FolderX}
        title="Categoria non trovata"
        action={{ label: 'Torna indietro', icon: ArrowLeft, onClick: () => router.push('/admin/servizi') }}
      />
    );
  }

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-6">
        <PageHeader
          back={{ href: '/admin/servizi', label: 'Servizi' }}
          title={category.name}
          meta={category.isArchived && (
            <StatusDot tone="warning" className="text-xs font-medium text-[var(--lume-text-secondary)]">
              Archiviata
            </StatusDot>
          )}
          subtitle={`${categoryServices.length} servizi`}
          actions={
            <>
              <Button
                variant="secondary"
                size="md"
                iconOnly
                aria-label={category.isArchived ? 'Ripristina categoria' : 'Archivia categoria'}
                onClick={handleToggleArchive}
              >
                {category.isArchived ? <ArchiveRestore /> : <Archive />}
              </Button>
              {!category.isArchived && (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setShowAdd(true)}>
                  Nuovo servizio
                </Button>
              )}
            </>
          }
        />

        <ServicesTable services={categoryServices} />
      </div>
    </>
  );
}
