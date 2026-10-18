import { User, Calendar, Check } from 'lucide-react';
import { startOfDay } from 'date-fns';
import { useClientsStore } from '@/lib/stores/clients';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';
import { FicheStatus } from './ficheStatus';
import type { FicheService } from './FicheService';
import type { FicheProduct } from './FicheProduct';
import type { DataColumn } from './dataColumn';
import type { Client } from './Client';
import type { Tables } from '@/lib/supabase/types';

export enum FicheBucket {
  PRENOTATA = 'prenotata',
  ARRETRATA = 'arretrata',
  CONCLUSA = 'conclusa',
}

export const FICHE_BUCKET_LABELS: Record<FicheBucket, string> = {
  [FicheBucket.PRENOTATA]: 'Prenotata',
  [FicheBucket.ARRETRATA]: 'Arretrata',
  [FicheBucket.CONCLUSA]: 'Conclusa',
};

/** Tailwind classes for the per-bucket status badge. Shared by FicheCard and
 *  the client-detail Storico fiche table so the colors stay in sync. */
export const BUCKET_STYLES: Record<FicheBucket, string> = {
  [FicheBucket.PRENOTATA]: 'bg-primary/10 text-primary-hover dark:text-primary/70 border-primary/20',
  [FicheBucket.ARRETRATA]: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  [FicheBucket.CONCLUSA]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
};

// A fiche becomes *arretrata* only on the day after its scheduled date,
// so an in-progress visit doesn't flicker into the overdue bucket.
export function getFicheBucket(fiche: { datetime: Date | string; status: FicheStatus }): FicheBucket {
  if (fiche.status === FicheStatus.COMPLETED) return FicheBucket.CONCLUSA;
  const today = startOfDay(new Date());
  const ficheDay = startOfDay(new Date(fiche.datetime));
  return ficheDay < today ? FicheBucket.ARRETRATA : FicheBucket.PRENOTATA;
}

/** How a fiche got into the database. 'online' is created by the public
 *  booking flow at lume.app/<slug>; 'manual' is everything else. */
export type FicheBookingSource = 'manual' | 'online';

export class Fiche {
  id: string;
  salon_id: string;
  client_id: string;
  /** ISO timestamp. */
  datetime: string;
  status: FicheStatus;
  note: string | null;
  total_override: number | null;
  miscela: string | null;
  tecnica: string | null;
  booking_source: FicheBookingSource;

  constructor(row: Tables<'fiches'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.client_id = row.client_id;
    this.datetime = row.datetime;
    this.status = row.status;
    this.note = row.note;
    this.total_override = row.total_override;
    this.miscela = row.miscela;
    this.tecnica = row.tecnica;
    this.booking_source = row.booking_source;
  }

  hasTreatmentData(): boolean {
    return !!(this.miscela?.trim() || this.tecnica?.trim() || this.note?.trim());
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
      (sum: number, fp: FicheProduct) => sum + fp.final_price,
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

  getBucket(): FicheBucket {
    return getFicheBucket(this);
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
