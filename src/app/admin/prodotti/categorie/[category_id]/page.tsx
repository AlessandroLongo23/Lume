'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useProductsStore } from '@/lib/stores/products';
import { AddProductModal } from '@/lib/components/admin/products/AddProductModal';
import { ProductsTable } from '@/lib/components/admin/products/ProductsTable';
import type { ProductCategory } from '@/lib/types/ProductCategory';

export default function ProductCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const products = useProductsStore((s) => s.products);
  const isLoading = useProductCategoriesStore((s) => s.isLoading);

  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const categoryId = params.category_id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = categories.find((c) => c.id === categoryId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setCategory(found);
    }
  }, [categories, categoryId, isLoading]);

  const categoryProducts = useMemo(() =>
    products.filter((p) => p.product_category_id === categoryId),
    [products, categoryId]
  );

  const stats = useMemo(() => ({
    total: categoryProducts.length,
    totalValue: categoryProducts.reduce((sum, p) => sum + (p.price ?? 0), 0),
    minPrice: categoryProducts.length ? Math.min(...categoryProducts.map((p) => p.price ?? 0)) : 0,
    maxPrice: categoryProducts.length ? Math.max(...categoryProducts.map((p) => p.price ?? 0)) : 0,
    avgPrice: categoryProducts.length ? categoryProducts.reduce((sum, p) => sum + (p.price ?? 0), 0) / categoryProducts.length : 0,
  }), [categoryProducts]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Categoria non trovata</h2>
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push('/admin/prodotti')}>Torna indietro</button>
      </div>
    );
  }

  return (
    <>
      <AddProductModal isOpen={showAdd} onClose={() => setShowAdd(false)} />

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/prodotti')} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{category.name}</h1>
            <p className="text-sm text-zinc-500">{stats.total} prodotti</p>
          </div>
          <button
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="size-4" />
            <span>Nuovo prodotto</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Prodotti totali', value: stats.total },
            { label: 'Valore totale', value: `€ ${stats.totalValue.toFixed(2)}` },
            { label: 'Prezzo medio', value: `€ ${stats.avgPrice.toFixed(2)}` },
            { label: 'Range prezzo', value: `€ ${stats.minPrice.toFixed(2)} – ${stats.maxPrice.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-500/25 p-4">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
          ))}
        </div>

        <ProductsTable products={categoryProducts} />
      </div>
    </>
  );
}
