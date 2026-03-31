'use client';

import { Scissors } from 'lucide-react';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { ServiceCategoryCard } from './ServiceCategoryCard';

export function ServicesCategories() {
  const { service_categories, isLoading } = useServiceCategoriesStore();

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100" />
    </div>
  );

  if (service_categories.length === 0) return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
      <Scissors className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
      <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">Nessuna categoria trovata</h3>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {service_categories.map((cat) => (
        <ServiceCategoryCard key={cat.id} category={cat} />
      ))}
    </div>
  );
}
