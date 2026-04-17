import { User, UserPlus, Tag, Calendar, CreditCard, Wallet, Banknote, ShieldCheck, ShieldOff } from 'lucide-react';
import type { DataColumn } from './dataColumn';

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

  constructor(c: Coupon) {
    this.id = c.id;
    this.salon_id = c.salon_id;
    this.kind = c.kind;
    this.recipient_client_id = c.recipient_client_id;
    this.purchaser_client_id = c.purchaser_client_id ?? null;
    this.discount_type = c.discount_type;
    this.discount_value = c.discount_value ?? null;
    this.free_item_kind = c.free_item_kind ?? null;
    this.free_item_id = c.free_item_id ?? null;
    this.original_value = c.original_value ?? null;
    this.remaining_value = c.remaining_value ?? null;
    this.valid_from = c.valid_from;
    this.valid_until = c.valid_until;
    this.scope_service_ids = c.scope_service_ids ?? null;
    this.scope_product_ids = c.scope_product_ids ?? null;
    this.scope_service_category_ids = c.scope_service_category_ids ?? null;
    this.scope_product_category_ids = c.scope_product_category_ids ?? null;
    this.sale_amount = c.sale_amount ?? null;
    this.sale_payment_method = c.sale_payment_method ?? null;
    this.notes = c.notes ?? null;
    this.is_active = c.is_active;
    this.created_by = c.created_by ?? null;
    this.created_at = c.created_at;
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
