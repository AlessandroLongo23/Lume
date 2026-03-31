import { Truck } from 'lucide-react';
import type { DataColumn } from './dataColumn';

export class Supplier {
  id: string;
  salon_id: string;
  name: string;

  constructor(supplier: Supplier) {
    this.id = supplier.id;
    this.salon_id = supplier.salon_id;
    this.name = supplier.name;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Nome',
      key: 'name',
      sortable: true,
      icon: Truck,
      display: (supplier: Supplier) => supplier.name,
    },
  ];
}
