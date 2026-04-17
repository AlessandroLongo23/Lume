import { User, Scissors, Hash, Wallet, CreditCard, Calendar, ShieldCheck } from 'lucide-react';
import type { DataColumn } from './dataColumn';
import type { FicheService } from './FicheService';

export type AbbonamentoPricingMode = 'percent' | 'manual';
export type AbbonamentoPaymentMethod = 'cash' | 'card' | 'transfer';
export type AbbonamentoStatus = 'attivo' | 'scaduto' | 'esaurito' | 'in attesa' | 'inattivo';

export class Abbonamento {
  id: string;
  salon_id: string;
  client_id: string;
  scope_service_ids: string[];
  total_treatments: number;
  pricing_mode: AbbonamentoPricingMode;
  discount_percent: number | null;
  total_paid: number;
  sale_payment_method: AbbonamentoPaymentMethod;
  valid_from: string;
  valid_until: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;

  constructor(a: Abbonamento) {
    this.id = a.id;
    this.salon_id = a.salon_id;
    this.client_id = a.client_id;
    this.scope_service_ids = a.scope_service_ids ?? [];
    this.total_treatments = a.total_treatments;
    this.pricing_mode = a.pricing_mode;
    this.discount_percent = a.discount_percent ?? null;
    this.total_paid = Number(a.total_paid);
    this.sale_payment_method = a.sale_payment_method;
    this.valid_from = a.valid_from;
    this.valid_until = a.valid_until ?? null;
    this.notes = a.notes ?? null;
    this.is_active = a.is_active;
    this.created_by = a.created_by ?? null;
    this.created_at = a.created_at;
  }

  get isExpired(): boolean {
    if (!this.valid_until) return false;
    const end = new Date(this.valid_until);
    end.setHours(23, 59, 59, 999);
    return end.getTime() < Date.now();
  }

  get isNotYetActive(): boolean {
    const start = new Date(this.valid_from);
    start.setHours(0, 0, 0, 0);
    return start.getTime() > Date.now();
  }

  /**
   * All fiche_services redeeming this abbonamento (any fiche status).
   * Pending fiches reserve their slot so operators can't double-book.
   */
  getRedemptions(): FicheService[] {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useFicheServicesStore } = require('@/lib/stores/fiche_services');
    return useFicheServicesStore
      .getState()
      .fiche_services.filter((fs: FicheService) => fs.abbonamento_id === this.id);
  }

  get usedTreatments(): number {
    return this.getRedemptions().length;
  }

  get remainingTreatments(): number {
    return Math.max(0, this.total_treatments - this.usedTreatments);
  }

  get isExhausted(): boolean {
    return this.remainingTreatments <= 0;
  }

  get isUsable(): boolean {
    return this.is_active && !this.isExpired && !this.isNotYetActive && !this.isExhausted;
  }

  displayStatus(): AbbonamentoStatus {
    if (!this.is_active) return 'inattivo';
    if (this.isExpired) return 'scaduto';
    if (this.isExhausted) return 'esaurito';
    if (this.isNotYetActive) return 'in attesa';
    return 'attivo';
  }

  displayPricing(): string {
    if (this.pricing_mode === 'percent' && this.discount_percent != null) {
      return `${this.discount_percent}% di sconto`;
    }
    return `€ ${this.total_paid.toFixed(2)}`;
  }

  displayScope(): string {
    const n = this.scope_service_ids.length;
    if (n === 0) return '—';
    if (n === 1) return serviceNameById(this.scope_service_ids[0]);
    return `${n} servizi`;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Cliente',
      key: 'client_id',
      sortable: true,
      icon: User,
      display: (a: Abbonamento) => clientNameById(a.client_id),
    },
    {
      label: 'Servizi',
      key: 'scope',
      sortable: false,
      icon: Scissors,
      display: (a: Abbonamento) => a.displayScope(),
    },
    {
      label: 'Rimanenti',
      key: 'remaining',
      sortable: true,
      icon: Hash,
      display: (a: Abbonamento) => `${a.remainingTreatments} / ${a.total_treatments}`,
    },
    {
      label: 'Incasso',
      key: 'total_paid',
      sortable: true,
      icon: Wallet,
      display: (a: Abbonamento) => `€ ${a.total_paid.toFixed(2)}`,
    },
    {
      label: 'Metodo',
      key: 'sale_payment_method',
      sortable: true,
      icon: CreditCard,
      display: (a: Abbonamento) => paymentMethodLabel(a.sale_payment_method),
    },
    {
      label: 'Scadenza',
      key: 'valid_until',
      sortable: true,
      icon: Calendar,
      display: (a: Abbonamento) =>
        a.valid_until ? new Date(a.valid_until).toLocaleDateString('it-IT') : 'Nessuna',
    },
    {
      label: 'Stato',
      key: 'status',
      sortable: true,
      icon: ShieldCheck,
      display: (a: Abbonamento) => a.displayStatus(),
    },
  ];
}

// ── Helpers (resolved at render time via store getState — matches Coupon.ts pattern)

function clientNameById(id: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useClientsStore } = require('@/lib/stores/clients');
  const client = useClientsStore.getState().clients.find((c: { id: string }) => c.id === id);
  return client ? `${client.firstName} ${client.lastName}` : 'N/A';
}

function serviceNameById(id: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useServicesStore } = require('@/lib/stores/services');
  const service = useServicesStore.getState().services.find((s: { id: string }) => s.id === id);
  return service?.name ?? 'N/A';
}

function paymentMethodLabel(m: AbbonamentoPaymentMethod): string {
  if (m === 'cash') return 'Contanti';
  if (m === 'card') return 'Carta';
  return 'Bonifico';
}
