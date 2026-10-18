import { User, AtSign, Phone } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { OperatingHourDay } from '@/lib/stores/salonSettings';
import type { Tables } from '@/lib/supabase/types';

export class Operator {
  id: string;
  salon_id: string;
  user_id: string | null;
  must_change_password: boolean;
  firstName: string;
  lastName: string;
  email: string | null;
  phonePrefix: string | null;
  phoneNumber: string | null;
  avatar_url: string | null;
  archived_at: string | null;
  /** Per-operator weekly schedule. `null` means: follow the salon's operating_hours. */
  working_hours: OperatingHourDay[] | null;

  constructor(row: Tables<'operators'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.user_id = row.user_id;
    this.must_change_password = row.must_change_password;
    this.firstName = row.firstName;
    this.lastName = row.lastName;
    this.email = row.email;
    this.phonePrefix = row.phonePrefix;
    this.phoneNumber = row.phoneNumber;
    this.avatar_url = row.avatar_url;
    this.archived_at = row.archived_at;
    // Written only by OperatorWorkingHoursPanel, always as an OperatingHourDay[].
    this.working_hours = Array.isArray(row.working_hours)
      ? (row.working_hours as unknown as OperatingHourDay[])
      : null;
  }

  get isArchived(): boolean {
    return this.archived_at !== null;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getPhoneNumber(): string {
    if (!this.phonePrefix || !this.phoneNumber) return '';
    return `${this.phonePrefix} ${this.phoneNumber}`;
  }

  /** WhatsApp chat link, or null when the operator has no phone number. */
  getWhatsAppUrl(): string | null {
    if (!this.phonePrefix || !this.phoneNumber) return null;
    return `https://wa.me/${(this.phonePrefix + this.phoneNumber).replace(/[^0-9]/g, '')}`;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Nome',
      key: 'firstName',
      sortable: true,
      icon: User,
      display: (operator: Operator) => operator.firstName,
    },
    {
      label: 'Cognome',
      key: 'lastName',
      sortable: true,
      icon: User,
      display: (operator: Operator) => operator.lastName,
    },
    {
      label: 'Email',
      key: 'email',
      sortable: true,
      icon: AtSign,
      display: (operator: Operator) => operator.email ?? '—',
      onclick: (operator: Operator) => {
        if (!operator.email) return;
        window.open(`mailto:${operator.email}`, '_blank');
      },
    },
    {
      label: 'Telefono',
      key: 'phone',
      sortable: false,
      icon: Phone,
      display: (operator: Operator) => operator.getPhoneNumber(),
      onclick: (operator: Operator) => {
        const url = operator.getWhatsAppUrl();
        if (url) window.open(url, '_blank');
      },
    },
  ];
}
