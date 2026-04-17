import { User, Calendar, Check } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';
import type { FicheStatus } from './ficheStatus';
import type { FicheService } from './FicheService';
import type { FicheProduct } from './FicheProduct';
import type { DataColumn } from './dataColumn';
import type { Client } from './Client';

export class Fiche {
  id: string;
  salon_id: string;
  client_id: string;
  datetime: Date;
  status: FicheStatus;
  note: string;
  total_override: number | null;

  constructor(fiche: Pick<Fiche, 'id' | 'salon_id' | 'client_id' | 'datetime' | 'status' | 'note'> & { total_override?: number | null }) {
    this.id = fiche.id;
    this.salon_id = fiche.salon_id;
    this.client_id = fiche.client_id;
    this.datetime = fiche.datetime;
    this.status = fiche.status;
    this.note = fiche.note;
    this.total_override = fiche.total_override ?? null;
  }

  getClient(): Client | null {
    return useClientsStore.getState().clients.find((c: Client) => c.id === this.client_id) ?? null;
  }

  getFicheServices(): FicheService[] {
    return useFicheServicesStore
      .getState()
      .fiche_services.filter((fs: FicheService) => fs.fiche_id === this.id);
  }

  getFicheProducts(): FicheProduct[] {
    return useFicheProductsStore.getState().fiche_products.filter((fp: FicheProduct) => fp.fiche_id === this.id);
  }

  getDuration(): number {
    return this.getFicheServices().reduce((sum, fs) => sum + fs.duration, 0);
  }

  getSubtotal(): number {
    const servicesTotal = this.getFicheServices().reduce((sum, fs) => sum + fs.final_price, 0);
    const productsTotal = this.getFicheProducts().reduce(
      (sum: number, fp: FicheProduct) => sum + (fp.final_price * (fp.quantity ?? 1)),
      0
    );
    return servicesTotal + productsTotal;
  }

  getTotal(): number {
    return this.total_override ?? this.getSubtotal();
  }

  hasDiscount(): boolean {
    return this.total_override !== null && this.total_override < this.getSubtotal();
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Cliente',
      key: 'client_id',
      sortable: true,
      icon: User,
      display: (fiche: Fiche) => fiche.getClient()?.getFullName() || 'N/A',
    },
    {
      label: 'Ora',
      key: 'time',
      sortable: true,
      icon: Calendar,
      display: (fiche: Fiche) => new Date(fiche.datetime).toLocaleTimeString('it-IT'),
    },
    {
      label: 'Stato',
      key: 'status',
      sortable: true,
      icon: Check,
      display: (fiche: Fiche) => fiche.status,
    },
  ];
}
