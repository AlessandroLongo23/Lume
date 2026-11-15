'use client';

import { useEffect } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import type { Invoice, InvoiceStatus } from '@/lib/types/Subscription';
import { StatusDot, type StatusTone } from '@/lib/components/shared/ui/StatusDot';
import { Button } from '@/lib/components/shared/ui/Button';
import { formatCurrency } from '@/lib/utils/format';

// `refunded` and `partially_refunded` are UI-only states derived from
// invoice.refundedAmount; Stripe itself keeps invoice.status = 'paid' after
// a refund and tracks the refund on the underlying charge.
type DisplayStatus = InvoiceStatus | 'refunded' | 'partially_refunded';

const STATUS_LABEL: Record<DisplayStatus, string> = {
  paid:               'Pagata',
  open:               'In attesa',
  void:               'Annullata',
  uncollectible:      'Non riscossa',
  draft:              'Bozza',
  refunded:           'Rimborsata',
  partially_refunded: 'Parzialmente rimborsata',
};

function statusTone(status: DisplayStatus): StatusTone {
  switch (status) {
    case 'paid':
      return 'success';
    case 'open':
      return 'warning';
    case 'uncollectible':
      return 'danger';
    case 'refunded':
    case 'partially_refunded':
    case 'void':
    case 'draft':
    default:
      return 'neutral';
  }
}

function deriveStatus(invoice: Invoice): DisplayStatus {
  if (invoice.refundedAmount > 0) {
    return invoice.refundedAmount >= invoice.amount ? 'refunded' : 'partially_refunded';
  }
  return invoice.status;
}

const formatInvoiceDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });

const formatAmount = (amount: number, currency: string): string => {
  if (currency === 'EUR') return formatCurrency(amount);
  return `${amount.toFixed(2)} ${currency}`;
};

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const status = deriveStatus(invoice);
  const isRefunded = status === 'refunded' || status === 'partially_refunded';

  return (
    <li className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 px-5 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--lume-text)]">
          {formatInvoiceDate(invoice.createdAt)}
        </div>
        {invoice.number && (
          <div className="tabular-nums text-xs text-[var(--lume-text-muted)] mt-0.5">
            {invoice.number}
          </div>
        )}
      </div>

      <div className="tabular-nums text-sm w-28 text-right">
        <div className={isRefunded ? 'text-[var(--lume-text-muted)] line-through' : 'text-[var(--lume-text)]'}>
          {formatAmount(invoice.amount, invoice.currency)}
        </div>
        {status === 'partially_refunded' && (
          <div className="text-xs text-[var(--lume-text-muted)] mt-0.5">
            −{formatAmount(invoice.refundedAmount, invoice.currency)}
          </div>
        )}
      </div>

      <div className="w-40 flex">
        <StatusDot tone={statusTone(status)} className="text-sm">{STATUS_LABEL[status]}</StatusDot>
      </div>

      <div className="w-12 flex justify-end">
        {invoice.invoicePdfUrl ? (
          <Button asChild variant="ghost" size="sm" iconOnly aria-label={`Scarica fattura del ${formatInvoiceDate(invoice.createdAt)}`}>
            <a
              href={invoice.invoicePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download />
            </a>
          </Button>
        ) : (
          <span className="size-8" aria-hidden />
        )}
      </div>
    </li>
  );
}

export function InvoiceList() {
  const invoices       = useSubscriptionStore((s) => s.invoices);
  const isLoading      = useSubscriptionStore((s) => s.invoicesLoading);
  const isLoaded       = useSubscriptionStore((s) => s.invoicesLoaded);
  const fetchInvoices  = useSubscriptionStore((s) => s.fetchInvoices);

  useEffect(() => {
    if (!isLoaded && !isLoading) fetchInvoices();
  }, [isLoaded, isLoading, fetchInvoices]);

  // Render nothing until we know whether there's history to show. Avoids a
  // jarring empty card on the trial/plan-picker view, and on Active state the
  // first invoice arrives within minutes of subscribing anyway.
  if (isLoaded && invoices.length === 0) return null;

  return (
    // Receipt-Paper aesthetic: deliberately off-palette warm white in light mode
    // (matches the Fiche thermal-receipt surface), neutral surface in dark.
    <section className="rounded-xl bg-receipt shadow-[inset_0_0_0_1px_var(--lume-line)] overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-line">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-[var(--lume-text-muted)]" aria-hidden />
          <h3 className="text-sm font-medium text-[var(--lume-text)]">Fatture</h3>
        </div>
        <span className="text-xs text-[var(--lume-text-muted)]">Ultime 12</span>
      </header>

      {isLoading && invoices.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 text-[var(--lume-text-muted)] animate-spin motion-reduce:animate-none" />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)}
        </ul>
      )}
    </section>
  );
}
