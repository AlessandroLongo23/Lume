import { User, AtSign, Phone, VenusAndMars, Calendar, Plane } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { Fiche } from './Fiche';
import { GenderTd } from '@/lib/components/admin/table/GenderTd';
import { TouristTd } from '@/lib/components/admin/table/TouristTd';

export class Client {
  id: string;
  salon_id: string;
  user_id: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phonePrefix: string | null;
  phoneNumber: string | null;
  gender: string;
  isTourist: boolean;
  birthDate: string;
  note: string;
  archived_at: string | null;
  photoUrl: string | null;

  constructor(client: Client) {
    this.id = client.id;
    this.salon_id = client.salon_id;
    this.user_id = client.user_id ?? null;
    this.firstName = client.firstName;
    this.lastName = client.lastName;
    this.email = client.email ?? null;
    this.phonePrefix = client.phonePrefix ?? null;
    this.phoneNumber = client.phoneNumber ?? null;
    this.gender = client.gender;
    this.isTourist = client.isTourist;
    this.birthDate = client.birthDate;
    this.note = client.note;
    this.archived_at = client.archived_at ?? null;
    this.photoUrl = client.photoUrl ?? null;
  }

  get isArchived(): boolean {
    return this.archived_at !== null;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  hasPhone(): boolean {
    return !!(this.phonePrefix && this.phoneNumber);
  }

  get hasIncompleteContact(): boolean {
    return !this.email && !this.hasPhone();
  }

  getPhoneNumber(): string {
    if (!this.hasPhone()) return '';
    return `${this.phonePrefix} ${this.phoneNumber}`;
  }

  getFiches(): Fiche[] {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useFichesStore } = require('@/lib/stores/fiches');
    return useFichesStore.getState().fiches.filter((fiche: Fiche) => fiche.client_id === this.id);
  }

  getTreatmentHistory(): Fiche[] {
    return this.getFiches()
      .filter((f) => f.hasTreatmentData())
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  }

  getLastTreatment(): Fiche | null {
    return this.getTreatmentHistory()[0] ?? null;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Nome',
      key: 'firstName',
      sortable: true,
      icon: User,
      display: (client: Client) => client.firstName,
    },
    {
      label: 'Cognome',
      key: 'lastName',
      sortable: true,
      icon: User,
      display: (client: Client) => client.lastName,
    },
    {
      label: 'Email',
      key: 'email',
      sortable: true,
      icon: AtSign,
      display: (client: Client) => client.email ?? '',
      onclick: (client: Client): void => {
        if (!client.email) return;
        window.open(`mailto:${client.email}`, '_blank');
      },
    },
    {
      label: 'Telefono',
      key: 'phone',
      sortable: false,
      icon: Phone,
      display: (client) => client.hasPhone() ? `${client.phonePrefix} ${client.phoneNumber}` : '',
      onclick: (client: Client) => {
        if (!client.hasPhone()) return;
        const phone = `${client.phonePrefix}${client.phoneNumber}`.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
      },
    },
    {
      label: '',
      key: 'gender',
      sortable: true,
      icon: VenusAndMars,
      component: {
        is: GenderTd,
        getProps: (client: Client) => ({ gender: client.gender }),
      },
    },
    {
      label: 'Data di nascita',
      key: 'birthDate',
      sortable: true,
      icon: Calendar,
      display: (client) =>
        client.birthDate ? new Date(client.birthDate).toLocaleDateString('it-IT') : 'N/A',
    },
    {
      label: '',
      key: 'isTourist',
      sortable: true,
      icon: Plane,
      component: {
        is: TouristTd,
        getProps: (client: Client) => ({ isTourist: client.isTourist }),
      },
    },
  ];
}
