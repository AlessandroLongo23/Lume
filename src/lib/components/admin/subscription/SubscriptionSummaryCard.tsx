'use client';

import { CreditCard, ExternalLink, Gift } from 'lucide-react';
import { useState } from 'react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { formatCurrency } from '@/lib/utils/format';

const PLAN_LABEL: Record<string, string> = {
  monthly: 'Mensile',
  yearly:  'Annuale',
};

const CARD_BRAND_LABEL: Record<string, string> = {
  visa:       'Visa',
  mastercard: 'Mastercard',
  amex:       'American Express',
  discover:   'Discover',
  jcb:        'JCB',
  diners:     'Diners Club',
  unionpay:   'UnionPay',
  unknown:    'Carta',
};

const formatRenewalDate = (iso: string | null): string | null => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

export function SubscriptionSummaryCard() {
  const subscriptionPlan   = useSubscriptionStore((s) => s.subscriptionPlan);
  const subscriptionEndsAt = useSubscriptionStore((s) => s.subscriptionEndsAt);
  const cancelAt           = useSubscriptionStore((s) => s.cancelAt);
  const paymentMethod      = useSubscriptionStore((s) => s.paymentMethod);
  const nextChargeAmount   = useSubscriptionStore((s) => s.nextChargeAmount);
  const isOnReferralCredit = useSubscriptionStore((s) => s.isOnReferralCredit);

  const [portalLoading, setPortalLoading] = useState(false);

  const planLabel = subscriptionPlan ? PLAN_LABEL[subscriptionPlan] ?? subscriptionPlan : '—';
  const renewalDate = formatRenewalDate(subscriptionEndsAt);
  const isCanceling = !!cancelAt;
  const cardBrand = paymentMethod
    ? CARD_BRAND_LABEL[paymentMethod.brand] ?? paymentMethod.brand
    : null;

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line">
        <div className="px-5 py-4">
          <div className="text-xs text-[var(--lume-text-secondary)]">
            Piano
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-medium text-[var(--lume-text)]">{planLabel}</span>
            {!isCanceling && (
              <StatusDot tone="success" className="text-xs">Attivo</StatusDot>
            )}
            {isCanceling && (
              <StatusDot tone="warning" className="text-xs">In annullamento</StatusDot>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="text-xs text-[var(--lume-text-secondary)]">
            {isCanceling ? 'Si chiuderà il' : 'Prossimo addebito'}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-medium text-[var(--lume-text)]">
              {renewalDate ?? '—'}
            </span>
            {!isCanceling && nextChargeAmount != null && (
              <span className="tabular-nums text-sm text-[var(--lume-text-secondary)]">
                · {formatCurrency(nextChargeAmount)}
              </span>
            )}
          </div>
          {isOnReferralCredit && !isCanceling && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
              <Gift className="size-3.5 text-success-strong" aria-hidden />
              Credito referral · 1 mese gratuito
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="text-xs text-[var(--lume-text-secondary)]">
            Metodo di pagamento
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {paymentMethod ? (
              <span className="text-base font-medium text-[var(--lume-text)] inline-flex items-center gap-2">
                <CreditCard className="size-4 text-[var(--lume-text-muted)]" aria-hidden />
                {cardBrand} <span className="tabular-nums text-sm text-[var(--lume-text-secondary)]">•••• {paymentMethod.last4}</span>
              </span>
            ) : (
              <span className="text-sm text-[var(--lume-text-secondary)]">Nessun metodo salvato</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={ExternalLink}
              onClick={openPortal}
              loading={portalLoading}
              aria-label="Aggiorna metodo di pagamento (apre il portale Stripe)"
            >
              Aggiorna
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
