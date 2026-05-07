'use client';

import { CreditCard, ExternalLink, Gift } from 'lucide-react';
import { useState } from 'react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';

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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Piano
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-semibold text-foreground">{planLabel}</span>
            {!isCanceling && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success-strong">
                Attivo
              </span>
            )}
            {isCanceling && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-strong">
                In annullamento
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {isCanceling ? 'Si chiuderà il' : 'Prossimo addebito'}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-base font-semibold text-foreground">
              {renewalDate ?? '—'}
            </span>
            {!isCanceling && nextChargeAmount != null && (
              <span className="font-mono text-sm text-muted-foreground">
                · {nextChargeAmount.toFixed(2).replace('.', ',')} €
              </span>
            )}
          </div>
          {isOnReferralCredit && !isCanceling && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success-strong">
              <Gift className="size-3" />
              Credito referral · 1 mese gratuito
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Metodo di pagamento
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            {paymentMethod ? (
              <span className="text-base font-semibold text-foreground inline-flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                {cardBrand} <span className="font-mono text-sm text-muted-foreground">•••• {paymentMethod.last4}</span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Nessun metodo salvato</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={ExternalLink}
              onClick={openPortal}
              loading={portalLoading}
              aria-label="Aggiorna metodo di pagamento (apre il portale Stripe)"
              className="shrink-0 text-primary hover:text-primary-hover"
            >
              Aggiorna
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
