import { Tag, Factory, Truck, Euro, ALargeSmall } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { Tables } from '@/lib/supabase/types';

export class Product {
  id: string;
  salon_id: string;
  name: string;
  product_category_id: string | null;
  manufacturer_id: string | null;
  supplier_id: string | null;
  price: number | null;
  sell_price: number | null;
  is_for_retail: boolean;
  stock_quantity: number;
  min_threshold: number;
  quantity_ml: number | null;
  archived_at: string | null;
  total_purchased: number;
  total_sold: number;

  /** Accepts a products_with_stats row, or a plain products row (totals then default to 0). */
  constructor(row: Tables<'products'> | Tables<'products_with_stats'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.name = row.name;
    this.product_category_id = row.product_category_id;
    this.manufacturer_id = row.manufacturer_id;
    this.supplier_id = row.supplier_id;
    this.price = row.price;
    this.sell_price = row.sell_price;
    this.is_for_retail = row.is_for_retail;
    this.stock_quantity = row.stock_quantity;
    this.min_threshold = row.min_threshold;
    this.quantity_ml = row.quantity_ml;
    this.archived_at = row.archived_at;
    this.total_purchased = 'total_purchased' in row ? row.total_purchased : 0;
    this.total_sold = 'total_sold' in row ? row.total_sold : 0;
  }

  get isArchived(): boolean {
    return this.archived_at !== null;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Categoria',
      key: 'product_category_id',
      sortable: true,
      icon: Tag,
      display: (product: Product) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useProductCategoriesStore } = require('@/lib/stores/product_categories');
        const { product_categories } = useProductCategoriesStore.getState();
        const category = product_categories.find((c: { id: string; name: string }) => c.id === product.product_category_id);
        return category ? category.name : 'N/A';
      },
    },
    {
      label: 'Nome',
      key: 'name',
      sortable: true,
      icon: ALargeSmall,
      display: (product: Product) => product.name,
    },
    {
      label: 'Produttore',
      key: 'manufacturer_id',
      sortable: true,
      icon: Factory,
      display: (product: Product) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useManufacturersStore } = require('@/lib/stores/manufacturers');
        const { manufacturers } = useManufacturersStore.getState();
        const manufacturer = manufacturers.find((m: { id: string; name: string }) => m.id === product.manufacturer_id);
        return manufacturer ? manufacturer.name : 'N/A';
      },
    },
    {
      label: 'Fornitore',
      key: 'supplier_id',
      sortable: true,
      icon: Truck,
      display: (product: Product) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useSuppliersStore } = require('@/lib/stores/suppliers');
        const { suppliers } = useSuppliersStore.getState();
        const supplier = suppliers.find((s: { id: string; name: string }) => s.id === product.supplier_id);
        return supplier ? supplier.name : 'N/A';
      },
    },
    {
      label: 'Prezzo',
      key: 'price',
      sortable: true,
      icon: Euro,
      display: (product: Product) => (product.price === null ? '—' : product.price.toFixed(2) + ' €'),
    },
  ];
}
