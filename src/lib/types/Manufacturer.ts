import { Factory } from 'lucide-react';
import type { DataColumn } from './dataColumn';

export class Manufacturer {
  id: string;
  name: string;

  constructor(manufacturer: Manufacturer) {
    this.id = manufacturer.id;
    this.name = manufacturer.name;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Nome',
      key: 'name',
      sortable: true,
      icon: Factory,
      display: (manufacturer: Manufacturer) => manufacturer.name,
    },
  ];
}
