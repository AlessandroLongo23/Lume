'use client';

import { useEffect } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import type { Invoice, InvoiceStatus } from '@/lib/types/Subscription';

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

function statusClasses(status: DisplayStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-success-soft text-success-strong';
    case 'open':
      return 'bg-warning-soft text-warning-strong';
    case 'uncollectible':
      return 'bg-danger-soft text-danger-strong';
    case 'refunded':
    case 'partially_refunded':
    case 'void':
    case 'draft':
    default:
      return 'bg-muted text-muted-foreground';
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
  if (currency === 'EUR') return `${amount.toFixed(2).replace('.', ',')} €`;
  return `${amount.toFixed(2)} ${currency}`;
};

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const status = deriveStatus(invoice);
  const isRefunded = status === 'refunded' || status === 'partially_refunded';

  return (
    <li className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">
          {formatInvoiceDate(invoice.createdAt)}
        </div>
        {invoice.number && (
          <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
            {invoice.number}
          </div>
        )}
      </div>

      <div className="font-mono text-sm tabular-nums w-32 text-right">
        <div className={isRefunded ? 'text-muted-foreground line-through' : 'text-foreground'}>
          {formatAmount(invoice.amount, invoice.currency)}
        </div>
        {status === 'partially_refunded' && (
          <div className="text-[11px] text-muted-foreground mt-0.5 no-underline">
            −{formatAmount(invoice.refundedAmount, invoice.currency)}
          </div>
        )}
      </div>

      <div className="w-40 flex justify-center">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClasses(status)}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="w-12 flex justify-end">
        {invoice.invoicePdfUrl ? (
          <a
            href={invoice.invoicePdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={`Scarica fattura del ${formatInvoiceDate(invoice.createdAt)}`}
          >
            <Download className="size-4" />
          </a>
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
    <div className="rounded-xl border border-border bg-receipt overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/40">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Fatture</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">Ultime 12</span>
      </header>

      {isLoading && invoices.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {invoices.map((inv) => <InvoiceRow key={inv.id} invoice={inv} />)}
        </ul>
      )}
    </div>
  );
}
