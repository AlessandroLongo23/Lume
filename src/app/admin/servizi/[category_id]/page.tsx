'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Archive, ArchiveRestore } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddServiceModal } from '@/lib/components/admin/services/AddServiceModal';
import { ServicesTable } from '@/lib/components/admin/services/ServicesTable';
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
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push('/admin/servizi')}>Torna indietro</button>
      </div>
    );
  }

  return (
    <>
      <AddServiceModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/servizi')} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
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
            <button
              onClick={handleToggleArchive}
              className="p-2 bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-amber-900/30 rounded-md transition-colors"
              title={category.isArchived ? 'Ripristina categoria' : 'Archivia categoria'}
            >
              {category.isArchived ? <ArchiveRestore className="size-5 text-zinc-600 dark:text-zinc-300" /> : <Archive className="size-5 text-zinc-600 dark:text-zinc-300" />}
            </button>
            {!category.isArchived && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="size-4" />
                <span>Nuovo servizio</span>
              </button>
            )}
          </div>
        </div>

        <ServicesTable services={categoryServices} />
      </div>
    </>
  );
}
