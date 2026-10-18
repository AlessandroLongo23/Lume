import { User, AtSign, Phone, VenusAndMars, Calendar, Plane } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { Fiche } from './Fiche';
import type { Gender } from './Gender';
import type { Tables } from '@/lib/supabase/types';
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
  gender: Gender | null;
  isTourist: boolean;
  birthDate: string | null;
  note: string | null;
  archived_at: string | null;
  /** When the client was added to the salon. Set by the database. */
  created_at: string;
  photoUrl: string | null;
  /** Explicit per-client color override. NULL means "use the deterministic
   *  hash of `id`" — see {@link colorForClient}. */
  color: string | null;
  /** Whitelist flag. Only consulted when the salon's
   *  `booking_config.access_mode = 'selected'`. Default true so existing
   *  clients keep working when an owner switches to selected mode. */
  can_book_online: boolean;

  constructor(row: Tables<'clients'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.user_id = row.user_id;
    this.firstName = row.firstName;
    this.lastName = row.lastName;
    this.email = row.email;
    this.phonePrefix = row.phonePrefix;
    this.phoneNumber = row.phoneNumber;
    this.gender = row.gender;
    this.isTourist = row.isTourist ?? false;
    this.birthDate = row.birthDate;
    this.note = row.note;
    this.archived_at = row.archived_at;
    this.created_at = row.created_at;
    this.photoUrl = row.photoUrl;
    this.color = row.color;
    this.can_book_online = row.can_book_online;
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
