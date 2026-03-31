'use client';

import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import type { ServiceCategory } from '@/lib/types/ServiceCategory';

interface ServiceCategoryCardProps {
  category: ServiceCategory;
}

export function ServiceCategoryCard({ category }: ServiceCategoryCardProps) {
  const router = useRouter();
  const services = useServicesStore((s) => s.services);
  const categoryServices = services.filter((s) => s.category_id === category.id);
  const avgDuration = categoryServices.length > 0
    ? Math.round(categoryServices.reduce((sum, s) => sum + s.duration, 0) / categoryServices.length)
    : 0;
  const avgPrice = categoryServices.length > 0
    ? categoryServices.reduce((sum, s) => sum + s.price, 0) / categoryServices.length
    : 0;

  const hue = (category.id.charCodeAt(0) * 53) % 360;
  const color = `hsl(${hue}, 60%, 50%)`;

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/admin/servizi/${category.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/servizi/${category.id}`)}
    >
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(${hue}, 60%, 90%)` }}>
            <Scissors className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{category.name}</h3>
            <p className="text-sm text-zinc-500">{categoryServices.length} servizi</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Durata media</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{avgDuration} min</p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Prezzo medio</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{avgPrice.toFixed(2)} €</p>
          </div>
        </div>
      </div>
    </div>
  );
}
