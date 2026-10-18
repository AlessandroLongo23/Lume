import { User, UserPlus, Tag, Calendar, CreditCard, Wallet, Banknote, ShieldCheck, ShieldOff } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { Tables } from '@/lib/supabase/types';

export type CouponKind = 'gift' | 'gift_card';
export type CouponDiscountType = 'fixed' | 'percent' | 'free_item';
export type CouponFreeItemKind = 'service' | 'product';
export type CouponSalePaymentMethod = 'cash' | 'card' | 'transfer';

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  fiche_id: string;
  salon_id: string;
  amount_applied: number;
  remaining_after: number | null;
  applied_by: string | null;
  applied_at: string;
}

export class Coupon {
  id: string;
  salon_id: string;
  kind: CouponKind;
  recipient_client_id: string;
  purchaser_client_id: string | null;
  discount_type: CouponDiscountType;
  discount_value: number | null;
  free_item_kind: CouponFreeItemKind | null;
  free_item_id: string | null;
  original_value: number | null;
  remaining_value: number | null;
  valid_from: string;
  valid_until: string;
  scope_service_ids: string[] | null;
  scope_product_ids: string[] | null;
  scope_service_category_ids: string[] | null;
  scope_product_category_ids: string[] | null;
  sale_amount: number | null;
  sale_payment_method: CouponSalePaymentMethod | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;

  constructor(row: Tables<'coupons'>) {
    this.id = row.id;
    this.salon_id = row.salon_id;
    this.kind = row.kind;
    this.recipient_client_id = row.recipient_client_id;
    this.purchaser_client_id = row.purchaser_client_id;
    this.discount_type = row.discount_type;
    this.discount_value = row.discount_value;
    this.free_item_kind = row.free_item_kind;
    this.free_item_id = row.free_item_id;
    this.original_value = row.original_value;
    this.remaining_value = row.remaining_value;
    this.valid_from = row.valid_from;
    this.valid_until = row.valid_until;
    this.scope_service_ids = row.scope_service_ids;
    this.scope_product_ids = row.scope_product_ids;
    this.scope_service_category_ids = row.scope_service_category_ids;
    this.scope_product_category_ids = row.scope_product_category_ids;
    this.sale_amount = row.sale_amount;
    this.sale_payment_method = row.sale_payment_method;
    this.notes = row.notes;
    this.is_active = row.is_active;
    this.created_by = row.created_by;
    this.created_at = row.created_at;
  }

  get isExpired(): boolean {
    return new Date(this.valid_until).getTime() < Date.now();
  }

  get isNotYetActive(): boolean {
    return new Date(this.valid_from).getTime() > Date.now();
  }

  get isExhausted(): boolean {
    return this.kind === 'gift_card' && (this.remaining_value ?? 0) <= 0;
  }

  get isUsable(): boolean {
    return this.is_active && !this.isExpired && !this.isNotYetActive && !this.isExhausted;
  }

  get hasUnlimitedScope(): boolean {
    const empty = (a: string[] | null) => !a || a.length === 0;
    return (
      empty(this.scope_service_ids) &&
      empty(this.scope_product_ids) &&
      empty(this.scope_service_category_ids) &&
      empty(this.scope_product_category_ids)
    );
  }

  displayDiscount(): string {
    if (this.kind === 'gift_card') {
      if (this.original_value == null) return 'Gift card';
      const remaining = this.remaining_value ?? this.original_value;
      return `€ ${remaining.toFixed(2)} / € ${this.original_value.toFixed(2)}`;
    }
    if (this.discount_type === 'fixed') return `€ ${(this.discount_value ?? 0).toFixed(2)}`;
    if (this.discount_type === 'percent') return `${this.discount_value ?? 0}%`;
    return 'Buono omaggio';
  }

  displayStatus(): 'attivo' | 'scaduto' | 'esaurito' | 'in attesa' | 'inattivo' {
    if (!this.is_active) return 'inattivo';
    if (this.isExpired) return 'scaduto';
    if (this.isExhausted) return 'esaurito';
    if (this.isNotYetActive) return 'in attesa';
    return 'attivo';
  }

  static giftDataColumns: DataColumn[] = [
    {
      label: 'Destinatario',
      key: 'recipient_client_id',
      sortable: true,
      icon: User,
      display: (c: Coupon) => clientNameById(c.recipient_client_id),
    },
    {
      label: 'Sconto',
      key: 'discount',
      sortable: false,
      icon: Tag,
      display: (c: Coupon) => c.displayDiscount(),
    },
    {
      label: 'Ambito',
      key: 'scope',
      sortable: false,
      icon: Tag,
      display: (c: Coupon) => describeScope(c),
    },
    {
      label: 'Valido fino al',
      key: 'valid_until',
      sortable: true,
      icon: Calendar,
      display: (c: Coupon) => new Date(c.valid_until).toLocaleDateString('it-IT'),
    },
    {
      label: 'Stato',
      key: 'status',
      sortable: true,
      icon: ShieldCheck,
      display: (c: Coupon) => c.displayStatus(),
    },
  ];

  static giftCardDataColumns: DataColumn[] = [
    {
      label: 'Destinatario',
      key: 'recipient_client_id',
      sortable: true,
      icon: User,
      display: (c: Coupon) => clientNameById(c.recipient_client_id),
    },
    {
      label: 'Acquirente',
      key: 'purchaser_client_id',
      sortable: true,
      icon: UserPlus,
      display: (c: Coupon) => (c.purchaser_client_id ? clientNameById(c.purchaser_client_id) : '—'),
    },
    {
      label: 'Saldo',
      key: 'remaining_value',
      sortable: true,
      icon: Wallet,
      display: (c: Coupon) => c.displayDiscount(),
    },
    {
      label: 'Incasso',
      key: 'sale_amount',
      sortable: true,
      icon: Banknote,
      display: (c: Coupon) => (c.sale_amount != null ? `€ ${c.sale_amount.toFixed(2)}` : '—'),
    },
    {
      label: 'Metodo',
      key: 'sale_payment_method',
      sortable: true,
      icon: CreditCard,
      display: (c: Coupon) => paymentMethodLabel(c.sale_payment_method),
    },
    {
      label: 'Valido fino al',
      key: 'valid_until',
      sortable: true,
      icon: Calendar,
      display: (c: Coupon) => new Date(c.valid_until).toLocaleDateString('it-IT'),
    },
    {
      label: 'Stato',
      key: 'status',
      sortable: true,
      icon: ShieldOff,
      display: (c: Coupon) => c.displayStatus(),
    },
  ];
}

// ── Helpers (resolved at render time via store getState — same pattern as Service.dataColumns)

function clientNameById(id: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useClientsStore } = require('@/lib/stores/clients');
  const client = useClientsStore.getState().clients.find((c: { id: string }) => c.id === id);
  return client ? `${client.firstName} ${client.lastName}` : 'N/A';
}

function describeScope(c: Coupon): string {
  if (c.hasUnlimitedScope) return 'Tutti i servizi e prodotti';
  const parts: string[] = [];
  if (c.scope_service_ids?.length) parts.push(`${c.scope_service_ids.length} servizi`);
  if (c.scope_service_category_ids?.length) parts.push(`${c.scope_service_category_ids.length} cat. servizi`);
  if (c.scope_product_ids?.length) parts.push(`${c.scope_product_ids.length} prodotti`);
  if (c.scope_product_category_ids?.length) parts.push(`${c.scope_product_category_ids.length} cat. prodotti`);
  return parts.join(' · ');
}

function paymentMethodLabel(m: CouponSalePaymentMethod | null): string {
  if (m === 'cash') return 'Contanti';
  if (m === 'card') return 'Carta';
  if (m === 'transfer') return 'Bonifico';
  return '—';
}
