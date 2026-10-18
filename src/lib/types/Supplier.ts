import { Truck, MapPin, Phone, Mail } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { Tables } from '@/lib/supabase/types';

export class Supplier {
  id: string;
  salon_id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;

  constructor(row: Tables<'suppliers'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.name = row.name;
    this.city = row.city;
    this.phone = row.phone;
    this.email = row.email;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Nome',
      key: 'name',
      sortable: true,
      icon: Truck,
      display: (supplier: Supplier) => supplier.name,
    },
    {
      label: 'Città',
      key: 'city',
      sortable: true,
      icon: MapPin,
      display: (supplier: Supplier) => supplier.city ?? '—',
    },
    {
      label: 'Telefono',
      key: 'phone',
      sortable: false,
      icon: Phone,
      display: (supplier: Supplier) => supplier.phone ?? '—',
    },
    {
      label: 'Email',
      key: 'email',
      sortable: true,
      icon: Mail,
      display: (supplier: Supplier) => supplier.email ?? '—',
    },
  ];
}
