import { User, AtSign, Phone } from 'lucide-react';
import type { DataColumn } from './dataColumn';

export class Operator {
  id: string;
  salon_id: string;
  user_id: string | null;
  must_change_password: boolean;
  firstName: string;
  lastName: string;
  email: string;
  phonePrefix: string;
  phoneNumber: string;

  constructor(operator: Operator) {
    this.id = operator.id;
    this.salon_id = operator.salon_id;
    this.user_id = operator.user_id ?? null;
    this.must_change_password = operator.must_change_password ?? false;
    this.firstName = operator.firstName;
    this.lastName = operator.lastName;
    this.email = operator.email;
    this.phonePrefix = operator.phonePrefix;
    this.phoneNumber = operator.phoneNumber;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getPhoneNumber(): string {
    return `${this.phonePrefix} ${this.phoneNumber}`;
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
      display: (operator: Operator) => operator.email,
      onclick: (operator: Operator) => {
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
        const phone = operator.phonePrefix.concat(operator.phoneNumber).replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${phone}`, '_blank');
      },
    },
  ];
}
