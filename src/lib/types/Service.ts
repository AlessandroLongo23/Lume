import { Tag, Clock, Euro, ALargeSmall, ShoppingCart } from 'lucide-react';
import { Filter } from './filters/Filter';
import type { DataColumn } from './dataColumn';
import type { Tables } from '@/lib/supabase/types';
import type { ServiceCategory } from './ServiceCategory';

export class Service {
  id: string;
  salon_id: string;
  name: string;
  /** Minutes; null when the salon never set one. */
  duration: number | null;
  price: number;
  product_cost: number;
  category_id: string | null;
  description: string | null;
  archived_at: string | null;
  /** When true, the service appears in the public booking catalog. */
  bookable_online: boolean;

  constructor(row: Tables<'services'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.name = row.name;
    this.duration = row.duration;
    this.price = row.price;
    this.product_cost = row.product_cost;
    this.category_id = row.category_id;
    this.description = row.description;
    this.archived_at = row.archived_at;
    this.bookable_online = row.bookable_online;
  }

  get isArchived(): boolean {
    return this.archived_at !== null;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Categoria',
      key: 'category_id',
      sortable: true,
      filter: Filter.CHOICES,
      icon: Tag,
      getFilterChoice: (service) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useServiceCategoriesStore } = require('@/lib/stores/service_categories');
        const { service_categories } = useServiceCategoriesStore.getState();
        const category: ServiceCategory | undefined = service_categories.find(
          (c: ServiceCategory) => c.id === service.category_id
        );
        return { value: service.category_id, label: category ? category.name : 'N/A' };
      },
      display: (service) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useServiceCategoriesStore } = require('@/lib/stores/service_categories');
        const { service_categories } = useServiceCategoriesStore.getState();
        const category = service_categories.find((c: ServiceCategory) => c.id === service.category_id);
        return category ? category.name : 'N/A';
      },
    },
    {
      label: 'Nome',
      key: 'name',
      sortable: true,
      filter: Filter.SEARCH,
      icon: ALargeSmall,
      display: (service) => service.name,
    },
    {
      label: 'Durata',
      key: 'duration',
      sortable: true,
      filter: Filter.NUMBER,
      icon: Clock,
      display: (service) => String(service.duration),
    },
    {
      label: 'Prezzo',
      key: 'price',
      sortable: true,
      filter: Filter.NUMBER,
      icon: Euro,
      display: (service) => service.price.toFixed(2) + ' €',
    },
    {
      label: 'Costo prodotti',
      key: 'product_cost',
      sortable: true,
      filter: Filter.NUMBER,
      icon: ShoppingCart,
      display: (service) => service.product_cost.toFixed(2) + ' €',
    },
  ];
}
