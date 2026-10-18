import { Factory } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { Tables } from '@/lib/supabase/types';

export class Manufacturer {
  id: string;
  salon_id: string;
  name: string;

  constructor(row: Tables<'manufacturers'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.name = row.name;
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
