'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Warehouse, Package, Tags, Truck, Factory, Plus, EllipsisVertical, Archive } from 'lucide-react';
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
  const [categorieAddTrigger, setCategorieAddTrigger] = useState(0);
  const [fornitoriAddTrigger, setFornitoriAddTrigger] = useState(0);
  const [marchiAddTrigger, setMarchiAddTrigger] = useState(0);

  const [productsShowArchived, setProductsShowArchived] = useState(false);
  const [categoriesShowArchived, setCategoriesShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const fetchProductCategories = useProductCategoriesStore((s) => s.fetchProductCategories);
  const fetchSuppliers = useSuppliersStore((s) => s.fetchSuppliers);
  const fetchManufacturers = useManufacturersStore((s) => s.fetchManufacturers);
  const products = useProductsStore((s) => s.products);
  const isProductsLoading = useProductsStore((s) => s.isLoading);
  const categories = useProductCategoriesStore((s) => s.product_categories);

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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const productsArchivedCount = products.filter((p) => p.isArchived).length;
  const categoriesArchivedCount = categories.filter((c) => c.isArchived).length;

  const visibleProducts = useMemo(
    () => products.filter((p) => (productsShowArchived ? p.isArchived : !p.isArchived)),
    [products, productsShowArchived]
  );

  const visibleCategories = useMemo(
    () => categories.filter((c) => (categoriesShowArchived ? c.isArchived : !c.isArchived)),
    [categories, categoriesShowArchived]
  );

  const openAddSheet = () => { setModalOpen(true); };

  const archivableTab = activeTab === 'prodotti' || activeTab === 'categorie';
  const tabShowArchived = activeTab === 'prodotti' ? productsShowArchived : categoriesShowArchived;
  const toggleTabShowArchived = () => {
    if (activeTab === 'prodotti') setProductsShowArchived((v) => !v);
    else if (activeTab === 'categorie') setCategoriesShowArchived((v) => !v);
  };
  const tabArchivedCount = activeTab === 'prodotti' ? productsArchivedCount : categoriesArchivedCount;
  const entityLabel = activeTab === 'prodotti' ? 'prodotti' : 'categorie';

  return (
    <>
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        trackInventory={trackInventory}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Magazzino"
          icon={Warehouse}
          actions={
            <>
              {activeTab === 'prodotti' ? (
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
              )}
              {archivableTab && (
                <div className="relative" ref={menuRef}>
                  <button
                    className="flex items-center justify-center size-9 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <EllipsisVertical className="size-4 text-zinc-500" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-lg z-20 py-1">
                      <button
                        className="flex flex-row items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors text-zinc-700 dark:text-zinc-300"
                        onClick={() => { toggleTabShowArchived(); setMenuOpen(false); }}
                      >
                        <Archive className="size-4 text-zinc-400" />
                        {tabShowArchived ? `Mostra ${entityLabel} attivi` : `Mostra ${entityLabel} archiviati`}
                        {tabArchivedCount > 0 && (
                          <span className="ml-auto text-xs font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                            {tabArchivedCount}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          }
        />

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const archivedForTab =
              id === 'prodotti' ? productsShowArchived :
              id === 'categorie' ? categoriesShowArchived : false;
            const countForTab =
              id === 'prodotti' ? productsArchivedCount :
              id === 'categorie' ? categoriesArchivedCount : 0;
            const displayLabel = archivedForTab ? `${label} archiviati` : label;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary-hover dark:text-primary/70'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                {displayLabel}
                {archivedForTab && countForTab > 0 && (
                  <span className="ml-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {countForTab}
                  </span>
                )}
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
              products={visibleProducts}
              trackInventory={trackInventory}
              onAdd={openAddSheet}
              showArchived={productsShowArchived}
            />
          )
        )}
        {activeTab === 'categorie' && (
          <CategorieTab
            addTrigger={categorieAddTrigger}
            categories={visibleCategories}
            showArchived={categoriesShowArchived}
          />
        )}
        {activeTab === 'fornitori' && <FornitoriTab addTrigger={fornitoriAddTrigger} />}
        {activeTab === 'marchi' && <MarchiTab addTrigger={marchiAddTrigger} />}
      </div>
    </>
  );
}
