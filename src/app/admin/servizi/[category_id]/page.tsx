'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Archive, ArchiveRestore } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
import { Button } from '@/lib/components/shared/ui/Button';
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
    return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Categoria non trovata</h2>
        <Button variant="secondary" size="sm" onClick={() => router.push('/admin/servizi')} className="mt-4">
          Torna indietro
        </Button>
      </div>
    );
  }

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="md"
            iconOnly
            aria-label="Torna ai servizi"
            onClick={() => router.push('/admin/servizi')}
          >
            <ArrowLeft />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{category.name}</h1>
              {category.isArchived && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Archiviata</span>
              )}
            </div>
            <p className="text-sm text-zinc-500">{categoryServices.length} servizi</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
          </div>
        </div>

        <ServicesTable services={categoryServices} />
      </div>
    </>
  );
}
