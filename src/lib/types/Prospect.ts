import {
  Building2,
  Phone,
  Smartphone,
  User,
  MapPin,
  Tag,
  Clock,
  CalendarClock,
  PhoneCall,
} from 'lucide-react';
import type { DataColumn } from './dataColumn';

export type ProspectStatus =
  | 'not_contacted'
  | 'no_answer'
  | 'callback_scheduled'
  | 'not_interested'
  | 'no_pc'
  | 'interested'
  | 'materials_sent'
  | 'signed_up';

export const PROSPECT_STATUSES: readonly ProspectStatus[] = [
  'not_contacted',
  'no_answer',
  'callback_scheduled',
  'not_interested',
  'no_pc',
  'interested',
  'materials_sent',
  'signed_up',
];

export const STATUS_LABEL: Record<ProspectStatus, string> = {
  not_contacted:      'Da chiamare',
  no_answer:          'Non risponde',
  callback_scheduled: 'Richiamare',
  not_interested:     'Non interessato',
  no_pc:              'Senza PC',
  interested:         'Interessato',
  materials_sent:     'Materiali inviati',
  signed_up:          'Cliente',
};

// Tone is one of: neutral / muted / warning / danger / success / accent.
// Each maps to a paired bg + text token in the chip.
export const STATUS_TONE: Record<ProspectStatus, 'neutral' | 'muted' | 'warning' | 'danger' | 'success' | 'accent'> = {
  not_contacted:      'neutral',
  no_answer:          'muted',
  callback_scheduled: 'warning',
  not_interested:     'danger',
  no_pc:              'danger',
  interested:         'accent',
  materials_sent:     'accent',
  signed_up:          'success',
};

// Statuses that still require a phone call (all others are handled via WhatsApp or are closed).
export const CALLABLE_STATUSES: ProspectStatus[] = ['not_contacted', 'no_answer', 'callback_scheduled'];

// Status considered "reached" (owner picked up at some point — useful or not).
const REACHED_STATUSES: ProspectStatus[] = ['not_interested', 'no_pc', 'interested', 'materials_sent', 'signed_up'];
const POSITIVE_STATUSES: ProspectStatus[] = ['interested', 'materials_sent', 'signed_up'];
const SENT_STATUSES:     ProspectStatus[] = ['materials_sent', 'signed_up'];

export type ProspectRow = {
  id:                 string;
  name:               string;
  phone_shop:         string | null;
  phone_personal:     string | null;
  owner_name:         string | null;
  google_maps_url:    string | null;
  comune_code:        string | null;
  city:               string | null;
  province:           string | null;
  region:             string | null;
  address:            string | null;
  status:             ProspectStatus;
  callback_at:        string | null;
  last_call_at:       string | null;
  call_count:         number;
  materials_sent_at:  string | null;
  current_software:   string | null;
  notes:              string | null;
  created_by:         string | null;
  created_at:         string;
  updated_at:         string;
};

export class Prospect {
  id:                 string;
  name:               string;
  phone_shop:         string | null;
  phone_personal:     string | null;
  owner_name:         string | null;
  google_maps_url:    string | null;
  comune_code:        string | null;
  city:               string | null;
  province:           string | null;
  region:             string | null;
  address:            string | null;
  status:             ProspectStatus;
  callback_at:        string | null;
  last_call_at:       string | null;
  call_count:         number;
  materials_sent_at:  string | null;
  current_software:   string | null;
  notes:              string | null;
  created_by:         string | null;
  created_at:         string;
  updated_at:         string;

  constructor(row: ProspectRow) {
    this.id                = row.id;
    this.name              = row.name;
    this.phone_shop        = row.phone_shop;
    this.phone_personal    = row.phone_personal;
    this.owner_name        = row.owner_name;
    this.google_maps_url   = row.google_maps_url;
    this.comune_code       = row.comune_code;
    this.city              = row.city;
    this.province          = row.province;
    this.region            = row.region;
    this.address           = row.address;
    this.status            = row.status;
    this.callback_at       = row.callback_at;
    this.last_call_at      = row.last_call_at;
    this.call_count        = row.call_count;
    this.materials_sent_at = row.materials_sent_at;
    this.current_software  = row.current_software;
    this.notes             = row.notes;
    this.created_by        = row.created_by;
    this.created_at        = row.created_at;
    this.updated_at        = row.updated_at;
  }

  get statusLabel(): string {
    return STATUS_LABEL[this.status];
  }

  get isReached(): boolean {
    return REACHED_STATUSES.includes(this.status);
  }

  get isPositive(): boolean {
    return POSITIVE_STATUSES.includes(this.status);
  }

  get isSent(): boolean {
    return SENT_STATUSES.includes(this.status);
  }

  get hasShopPhone():     boolean { return !!this.phone_shop?.trim(); }
  get hasPersonalPhone(): boolean { return !!this.phone_personal?.trim(); }

  get cityProvince(): string {
    if (this.city && this.province) return `${this.city} (${this.province})`;
    return this.city ?? '';
  }

  whatsappUrl(phone: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) return null;
    return `https://wa.me/${digits.startsWith('39') ? digits : '39' + digits}`;
  }

  static computeStats(prospects: Prospect[]) {
    const total      = prospects.length;
    const byStatus: Record<ProspectStatus, number> = {
      not_contacted: 0, no_answer: 0, callback_scheduled: 0,
      not_interested: 0, no_pc: 0, interested: 0,
      materials_sent: 0, signed_up: 0,
    };
    for (const p of prospects) byStatus[p.status]++;

    const called   = total - byStatus.not_contacted;
    const reached  = byStatus.not_interested + byStatus.no_pc + byStatus.interested + byStatus.materials_sent + byStatus.signed_up;
    const positive = byStatus.interested + byStatus.materials_sent + byStatus.signed_up;
    const sent     = byStatus.materials_sent + byStatus.signed_up;

    return {
      total, byStatus, called, reached, positive, sent,
      answerRate:     called  > 0 ? reached  / called  : null,
      interestedRate: reached > 0 ? positive / reached : null,
      sentRate:       reached > 0 ? sent     / reached : null,
    };
  }

  static dataColumns: DataColumn[] = [
    {
      label:    'Salone',
      key:      'name',
      sortable: true,
      icon:     Building2,
      display:  (p: Prospect) => p.name,
    },
    {
      label:    'Comune',
      key:      'city',
      sortable: true,
      icon:     MapPin,
      display:  (p: Prospect) => p.cityProvince,
    },
    {
      label:    'Provincia',
      key:      'province',
      sortable: true,
      icon:     MapPin,
      display:  (p: Prospect) => p.province ?? '',
    },
    {
      label:    'Regione',
      key:      'region',
      sortable: true,
      icon:     MapPin,
      display:  (p: Prospect) => p.region ?? '',
    },
    {
      label:    'Telefono salone',
      key:      'phone_shop',
      sortable: false,
      icon:     Phone,
      display:  (p: Prospect) => p.phone_shop ?? '',
    },
    {
      label:    'Telefono titolare',
      key:      'phone_personal',
      sortable: false,
      icon:     Smartphone,
      display:  (p: Prospect) => p.phone_personal ?? '',
    },
    {
      label:    'Titolare',
      key:      'owner_name',
      sortable: true,
      icon:     User,
      display:  (p: Prospect) => p.owner_name ?? '',
    },
    {
      label:    'Stato',
      key:      'status',
      sortable: true,
      icon:     Tag,
      display:  (p: Prospect) => p.statusLabel,
    },
    {
      label:    'Ultima chiamata',
      key:      'last_call_at',
      sortable: true,
      icon:     PhoneCall,
      display:  (p: Prospect) =>
        p.last_call_at ? new Date(p.last_call_at).toLocaleDateString('it-IT') : '',
    },
    {
      label:    'Da richiamare',
      key:      'callback_at',
      sortable: true,
      icon:     CalendarClock,
      display:  (p: Prospect) =>
        p.callback_at ? new Date(p.callback_at).toLocaleString('it-IT') : '',
    },
    {
      label:    'Chiamate',
      key:      'call_count',
      sortable: true,
      icon:     PhoneCall,
      display:  (p: Prospect) => String(p.call_count),
    },
    {
      label:    'Software',
      key:      'current_software',
      sortable: true,
      icon:     Tag,
      display:  (p: Prospect) => p.current_software ?? '',
    },
    {
      label:    'Aggiunto',
      key:      'created_at',
      sortable: true,
      icon:     Clock,
      display:  (p: Prospect) => new Date(p.created_at).toLocaleDateString('it-IT'),
    },
  ];
}
