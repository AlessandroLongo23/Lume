'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { EditProductModal } from '@/lib/components/admin/products/EditProductModal';
import { DeleteProductModal } from '@/lib/components/admin/products/DeleteProductModal';
import type { Product } from '@/lib/types/Product';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const products = useProductsStore((s) => s.products);
  const isLoading = useProductsStore((s) => s.isLoading);
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const manufacturers = useManufacturersStore((s) => s.manufacturers);
  const suppliers = useSuppliersStore((s) => s.suppliers);

  const [product, setProduct] = useState<Product | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});

  const productId = params.prodotto_id as string;

  useEffect(() => {
    if (!isLoading) {
      const found = products.find((p) => p.id === productId);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setProduct(found);
    }
  }, [products, productId, isLoading]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-12 h-12 border-4 border-zinc-500/25 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <h2 className="text-xl font-bold">Prodotto non trovato</h2>
        <button className="mt-4 px-4 py-2 bg-zinc-200 rounded-md" onClick={() => router.push('/admin/prodotti')}>Torna indietro</button>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.product_category_id);
  const manufacturer = manufacturers.find((m) => m.id === product.manufacturer_id);
  const supplier = suppliers.find((s) => s.id === product.supplier_id);

  return (
    <>
      <EditProductModal isOpen={showEdit} onClose={() => setShowEdit(false)} selectedProduct={product} editedProduct={editedProduct} onEditedProductChange={setEditedProduct} />
      <DeleteProductModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedProduct={product} />

      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/prodotti')} className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
            <ArrowLeft className="size-5 text-zinc-600 dark:text-zinc-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{product.name}</h1>
            <p className="text-sm text-zinc-500">Dettagli prodotto</p>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => { setEditedProduct(product); setShowEdit(true); }} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 rounded-md">
              <Edit className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
            <button onClick={() => setShowDelete(true)} className="p-2 bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 rounded-md">
              <Trash2 className="size-5 text-zinc-600 dark:text-zinc-300" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-500/25 p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Categoria', value: category?.name ?? '—' },
            { label: 'Produttore', value: manufacturer?.name ?? '—' },
            { label: 'Fornitore', value: supplier?.name ?? '—' },
            { label: 'Prezzo', value: `€ ${product.price?.toFixed(2) ?? '0.00'}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500">{label}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
