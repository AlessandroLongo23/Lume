'use client';

import { useMemo, useState } from 'react';
import { ALargeSmall, Factory, Tag, Truck, Euro, Package, AlertTriangle } from 'lucide-react';
import { Table } from '@/lib/components/admin/table/Table';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { Filter } from '@/lib/types/filters/Filter';
import { DeleteProductModal } from './DeleteProductModal';
import type { DataColumn } from '@/lib/types/dataColumn';
import type { Product } from '@/lib/types/Product';

// ─── Stock badge component ────────────────────────────────────────────────────

function StockBadge({ stock_quantity, min_threshold }: { stock_quantity: number; min_threshold: number }) {
  const isLow = stock_quantity <= min_threshold;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isLow
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
      }`}
    >
      {isLow && <AlertTriangle className="size-3" />}
      {stock_quantity}
    </span>
  );
}

// ─── Base columns (always shown) ──────────────────────────────────────────────

const BASE_COLUMNS: DataColumn[] = [
  {
    label: 'Nome',
    key: 'name',
    sortable: true,
    icon: ALargeSmall,
    filter: Filter.SEARCH,
    display: (p: Product) => p.name,
  },
  {
    label: 'Marca',
    key: 'manufacturer_id',
    sortable: true,
    icon: Factory,
    filter: Filter.CHOICES,
    getFilterChoice: (p: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useManufacturersStore: store } = require('@/lib/stores/manufacturers');
      const { manufacturers } = store.getState();
      const m = manufacturers.find((x: { id: string; name: string }) => x.id === p.manufacturer_id);
      return { value: p.manufacturer_id ?? '', label: m?.name ?? '—' };
    },
    display: (p: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useManufacturersStore: store } = require('@/lib/stores/manufacturers');
      const { manufacturers } = store.getState();
      const m = manufacturers.find((x: { id: string; name: string }) => x.id === p.manufacturer_id);
      return m?.name ?? '—';
    },
  },
  {
    label: 'Categoria',
    key: 'product_category_id',
    sortable: true,
    icon: Tag,
    filter: Filter.CHOICES,
    getFilterChoice: (p: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useProductCategoriesStore: store } = require('@/lib/stores/product_categories');
      const { product_categories } = store.getState();
      const c = product_categories.find((x: { id: string; name: string }) => x.id === p.product_category_id);
      return { value: p.product_category_id ?? '', label: c?.name ?? '—' };
    },
    display: (p: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useProductCategoriesStore: store } = require('@/lib/stores/product_categories');
      const { product_categories } = store.getState();
      const c = product_categories.find((x: { id: string; name: string }) => x.id === p.product_category_id);
      return c?.name ?? '—';
    },
  },
  {
    label: 'Fornitore',
    key: 'supplier_id',
    sortable: true,
    icon: Truck,
    filter: Filter.CHOICES,
    getFilterChoice: (p: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useSuppliersStore: store } = require('@/lib/stores/suppliers');
      const { suppliers } = store.getState();
      const s = suppliers.find((x: { id: string; name: string }) => x.id === p.supplier_id);
      return { value: p.supplier_id ?? '', label: s?.name ?? '—' };
    },
    display: (p: Product) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useSuppliersStore: store } = require('@/lib/stores/suppliers');
      const { suppliers } = store.getState();
      const s = suppliers.find((x: { id: string; name: string }) => x.id === p.supplier_id);
      return s?.name ?? '—';
    },
  },
  {
    label: 'Prezzo Acquisto',
    key: 'price',
    sortable: true,
    icon: Euro,
    filter: Filter.NUMBER,
    display: (p: Product) => `${Number(p.price).toFixed(2)} €`,
  },
];

// ─── Inventory columns (feature-flagged) ──────────────────────────────────────

const INVENTORY_COLUMNS: DataColumn[] = [
  {
    label: 'Giacenza',
    key: 'stock_quantity',
    sortable: true,
    icon: Package,
    filter: Filter.NUMBER,
    component: {
      is: StockBadge as React.ComponentType<{ stock_quantity: number; min_threshold: number }>,
      getProps: (p: Product) => ({ stock_quantity: p.stock_quantity ?? 0, min_threshold: p.min_threshold ?? 0 }),
    },
  },
  {
    label: 'Soglia Min.',
    key: 'min_threshold',
    sortable: true,
    icon: AlertTriangle,
    display: (p: Product) => String(p.min_threshold ?? 0),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface ProductsTabProps {
  products: Product[];
  trackInventory: boolean;
  onEdit: (product: Product) => void;
}

export function ProductsTab({ products, trackInventory, onEdit }: ProductsTabProps) {
  const isLoading = useProductsStore((s) => s.isLoading);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Suppress unused import warnings — stores used in column closures above
  void useProductCategoriesStore;
  void useManufacturersStore;
  void useSuppliersStore;

  const columns = useMemo<DataColumn[]>(
    () => (trackInventory ? [...BASE_COLUMNS, ...INVENTORY_COLUMNS] : BASE_COLUMNS),
    [trackInventory],
  );

  const handleEditClick = (e: React.MouseEvent, item: Product) => {
    e.stopPropagation();
    onEdit(item);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: Product) => {
    e.stopPropagation();
    setSelectedProduct(item);
    setShowDelete(true);
  };

  return (
    <>
      <DeleteProductModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedProduct={selectedProduct}
      />
      <Table
        columns={columns}
        data={products}
        isLoading={isLoading}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        labelPlural="prodotti"
        labelSingular="prodotto"
      />
    </>
  );
}
