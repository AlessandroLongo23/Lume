import { User, AtSign, Phone, VenusAndMars, Calendar, Plane, Tag } from 'lucide-react';
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
  email: string;
  phonePrefix: string;
  phoneNumber: string;
  gender: string;
  isTourist: boolean;
  birthDate: string;
  note: string;
  categoryId: string;

  constructor(client: Client) {
    this.id = client.id;
    this.salon_id = client.salon_id;
    this.user_id = client.user_id ?? null;
    this.firstName = client.firstName;
    this.lastName = client.lastName;
    this.email = client.email;
    this.phonePrefix = client.phonePrefix;
    this.phoneNumber = client.phoneNumber;
    this.gender = client.gender;
    this.isTourist = client.isTourist;
    this.birthDate = client.birthDate;
    this.note = client.note;
    this.categoryId = client.categoryId;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getPhoneNumber(): string {
    return `${this.phonePrefix} ${this.phoneNumber}`;
  }

  getFiches(): Fiche[] {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useFichesStore } = require('@/lib/stores/fiches');
    return useFichesStore.getState().fiches.filter((fiche: Fiche) => fiche.client_id === this.id);
  }

  getLastNote(): string {
    return this.getFiches().at(-1)?.note || '';
  }

  static dataColumns: DataColumn[] = [
    {
      label: '',
      key: 'categoryId',
      sortable: true,
      icon: Tag,
      display: (client: Client) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useClientCategoriesStore } = require('@/lib/stores/client_categories');
        const { client_categories } = useClientCategoriesStore.getState();
        const category = client_categories.find((cat: { id: string; name: string }) => cat.id === client.categoryId);
        return category ? category.name : 'N/A';
      },
    },
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
      display: (client: Client) => client.email,
      onclick: (client: Client): void => {
        window.open(`mailto:${client.email}`, '_blank');
      },
    },
    {
      label: 'Telefono',
      key: 'phone',
      sortable: false,
      icon: Phone,
      display: (client) => client.phonePrefix + ' ' + client.phoneNumber,
      onclick: (client: Client) => {
        const phone = client.phonePrefix.concat(client.phoneNumber).replace(/[^0-9]/g, '');
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
