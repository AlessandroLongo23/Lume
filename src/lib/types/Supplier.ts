import { Truck, MapPin, Phone, Mail } from 'lucide-react';
import type { DataColumn } from './dataColumn';

export class Supplier {
  id: string;
  salon_id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;

  constructor(supplier: Supplier) {
    this.id = supplier.id;
    this.salon_id = supplier.salon_id;
    this.name = supplier.name;
    this.city = supplier.city ?? null;
    this.phone = supplier.phone ?? null;
    this.email = supplier.email ?? null;
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
