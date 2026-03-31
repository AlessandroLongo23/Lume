import { User, Calendar, Check } from 'lucide-react';
import type { FicheStatus } from './ficheStatus';
import type { FicheService } from './FicheService';
import type { DataColumn } from './dataColumn';
import type { Client } from './Client';

export class Fiche {
  id: string;
  client_id: string;
  datetime: Date;
  status: FicheStatus;
  note: string;

  constructor(fiche: Fiche) {
    this.id = fiche.id;
    this.client_id = fiche.client_id;
    this.datetime = fiche.datetime;
    this.status = fiche.status;
    this.note = fiche.note;
  }

  getClient(): Client | null {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useClientsStore } = require('@/lib/stores/clients');
    return useClientsStore.getState().clients.find((c: Client) => c.id === this.client_id) ?? null;
  }

  getFicheServices(): FicheService[] {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useFicheServicesStore } = require('@/lib/stores/fiche_services');
    return useFicheServicesStore
      .getState()
      .fiche_services.filter((fs: FicheService) => fs.fiche_id === this.id);
  }

  getDuration(): number {
    return this.getFicheServices().reduce((sum, fs) => sum + fs.duration, 0);
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
