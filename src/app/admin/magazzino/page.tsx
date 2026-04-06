'use client';

import { useState, useEffect } from 'react';
import { Warehouse, Package, Tags, Truck, Factory, Plus } from 'lucide-react';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { ProductsTab } from '@/lib/components/admin/magazzino/ProductsTab';
import { CategorieTab } from '@/lib/components/admin/magazzino/CategorieTab';
import { FornitoriTab } from '@/lib/components/admin/magazzino/FornitoriTab';
import { MarchiTab } from '@/lib/components/admin/magazzino/MarchiTab';
import { ProductModal } from '@/lib/components/admin/magazzino/ProductModal';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import type { Product } from '@/lib/types/Product';

type Tab = 'prodotti' | 'categorie' | 'fornitori' | 'marchi';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'prodotti', label: 'Prodotti', icon: Package },
  { id: 'categorie', label: 'Categorie', icon: Tags },
  { id: 'fornitori', label: 'Fornitori', icon: Truck },
  { id: 'marchi', label: 'Marchi', icon: Factory },
];

export default function MagazzinoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('prodotti');
  const [trackInventory, setTrackInventory] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categorieAddTrigger, setCategorieAddTrigger] = useState(0);
  const [fornitoriAddTrigger, setFornitoriAddTrigger] = useState(0);
  const [marchiAddTrigger, setMarchiAddTrigger] = useState(0);

  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const fetchProductCategories = useProductCategoriesStore((s) => s.fetchProductCategories);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const fetchManufacturers = useManufacturersStore((s) => s.fetchManufacturers);
  const products = useProductsStore((s) => s.products);
  const isProductsLoading = useProductsStore((s) => s.isLoading);

  useEffect(() => {
    fetchProducts();
    fetchProductCategories();
    fetchSuppliers();
    fetchManufacturers();

    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.track_inventory === 'boolean') setTrackInventory(data.track_inventory);
      })
      .catch(() => {});
  }, [fetchProducts, fetchProductCategories, fetchSuppliers, fetchManufacturers]);

  const openAddSheet = () => { setSelectedProduct(null); setModalOpen(true); };
  const openEditSheet = (product: Product) => { setSelectedProduct(product); setModalOpen(true); };

  return (
    <>
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedProduct={selectedProduct}
        trackInventory={trackInventory}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Magazzino"
          icon={Warehouse}
          actions={
            activeTab === 'prodotti' ? (
              <button
                onClick={openAddSheet}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Nuovo Prodotto
              </button>
            ) : activeTab === 'categorie' ? (
              <button
                onClick={() => setCategorieAddTrigger((n) => n + 1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Nuova Categoria
              </button>
            ) : activeTab === 'fornitori' ? (
              <button
                onClick={() => setFornitoriAddTrigger((n) => n + 1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Nuovo Fornitore
              </button>
            ) : (
              <button
                onClick={() => setMarchiAddTrigger((n) => n + 1)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Nuovo Marchio
              </button>
            )
          }
        />

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'prodotti' && (
          isProductsLoading ? (
            <TableSkeleton />
          ) : (
            <ProductsTab
              products={products}
              trackInventory={trackInventory}
              onEdit={openEditSheet}
              onAdd={openAddSheet}
            />
          )
        )}
        {activeTab === 'categorie' && <CategorieTab addTrigger={categorieAddTrigger} />}
        {activeTab === 'fornitori' && <FornitoriTab addTrigger={fornitoriAddTrigger} />}
        {activeTab === 'marchi' && <MarchiTab addTrigger={marchiAddTrigger} />}
      </div>
    </>
  );
}
