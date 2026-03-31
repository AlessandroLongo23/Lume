'use client';

import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import type { ProductCategory } from '@/lib/types/ProductCategory';

interface ProductCategoryCardProps {
  category: ProductCategory;
}

export function ProductCategoryCard({ category }: ProductCategoryCardProps) {
  const router = useRouter();
  const products = useProductsStore((s) => s.products);
  const categoryProducts = products.filter((p) => p.product_category_id === category.id);
  const totalValue = categoryProducts.reduce((sum, p) => sum + p.price, 0);
  const avgPrice = categoryProducts.length > 0 ? totalValue / categoryProducts.length : 0;

  // Simple hash-based color
  const hue = (category.id.charCodeAt(0) * 37) % 360;
  const color = `hsl(${hue}, 60%, 50%)`;

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/admin/prodotti/categorie/${category.id}`)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/admin/prodotti/categorie/${category.id}`)}
    >
      <div className="h-2" style={{ backgroundColor: color }} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `hsl(${hue}, 60%, 90%)` }}>
            <Package className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{category.name}</h3>
            <p className="text-sm text-zinc-500">{categoryProducts.length} prodotti</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
            <p className="text-xs text-zinc-500 mb-1">Valore totale</p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{totalValue.toFixed(2)} €</p>
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
