import { Tag, Factory, Truck, Euro, ALargeSmall } from 'lucide-react';
import type { DataColumn } from './dataColumn';

export class Product {
  id: string;
  salon_id: string;
  name: string;
  product_category_id: string;
  manufacturer_id: string;
  supplier_id: string;
  price: number;

  constructor(product: Product) {
    this.id = product.id;
    this.salon_id = product.salon_id;
    this.name = product.name;
    this.product_category_id = product.product_category_id;
    this.manufacturer_id = product.manufacturer_id;
    this.supplier_id = product.supplier_id;
    this.price = product.price;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Categoria',
      key: 'product_category_id',
      sortable: true,
      icon: Tag,
      display: (product: Product) => {
        // Resolved at render time via store getState
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
      display: (product: Product) => product.price.toFixed(2) + ' €',
    },
  ];
}
