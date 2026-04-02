import { Tag, Clock, Euro, ALargeSmall, ShoppingCart } from 'lucide-react';
import { Filter } from './filters/Filter';
import type { DataColumn } from './dataColumn';
import type { ServiceCategory } from './ServiceCategory';

export class Service {
  id: string;
  salon_id: string;
  name: string;
  duration: number;
  price: number;
  product_cost: number;
  category_id: string;
  description: string;

  constructor(service: Service) {
    this.id = service.id;
    this.salon_id = service.salon_id;
    this.name = service.name;
    this.duration = service.duration;
    this.price = service.price;
    this.product_cost = service.product_cost ?? 0;
    this.category_id = service.category_id;
    this.description = service.description;
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
