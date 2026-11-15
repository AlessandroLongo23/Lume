'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Check, Copy, CreditCard, Gift, Loader2, Crown,
  Clock3, Sparkles, Store, ExternalLink,
} from 'lucide-react';
import { useSubscriptionStore, type Referral } from '@/lib/stores/subscription';
import { formatDateDisplay } from '@/lib/utils/format';
import { PLANS } from '@/lib/stripe/config';
import { SubscriptionSummaryCard } from '@/lib/components/admin/subscription/SubscriptionSummaryCard';
import { InvoiceList } from '@/lib/components/admin/subscription/InvoiceList';
import { CancelSubscriptionModal } from '@/lib/components/admin/subscription/CancelSubscriptionModal';
import { ReactivateBanner } from '@/lib/components/admin/subscription/ReactivateBanner';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { Button } from '@/lib/components/shared/ui/Button';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { Stat, StatRow } from '@/lib/components/shared/ui/StatRow';

// ─────────────────────────────────────────────────────────────────────────────
// Status badges (trial, past-due, expired) — Active state lives in
// SubscriptionSummaryCard, not here.
// ─────────────────────────────────────────────────────────────────────────────
function TrialChip() {
  const trialDaysLeft = useSubscriptionStore((s) => s.trialDaysLeft);
  const daysText = trialDaysLeft === 1 ? '1 giorno' : `${trialDaysLeft} giorni`;
  return (
    <StatusDot tone="info" className="text-sm">
      Prova gratuita: {daysText} rimanenti
    </StatusDot>
  );
}

function PastDueChip() {
  const [loading, setLoading] = useState(false);
  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { setLoading(false); }
  };
  return (
    <Callout
      tone="warning"
      title="Pagamento non riuscito."
      action={
        <Button
          variant="primary"
          size="sm"
          loading={loading}
          leadingIcon={CreditCard}
          onClick={openPortal}
        >
          Aggiorna metodo
        </Button>
      }
    >
      Aggiorna il metodo di pagamento per non perdere l&apos;accesso.
    </Callout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan card — used in two contexts:
//   * Trial state: full pricing card, monthly secondary / yearly primary.
//   * Active state: compact "switch plan" rows, both secondary, current
//     plan disabled. We render the same component with `compact` flag.
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({
  planKey,
  recommended,
  isCurrentPlan,
  isOperator,
  hasActiveSub,
}: {
  planKey:       'monthly' | 'yearly';
  recommended?:  boolean;
  isCurrentPlan: boolean;
  isOperator:    boolean;
  hasActiveSub:  boolean;
}) {
  const plan = PLANS[planKey];
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { setLoading(false); }
  };

  const handleChangePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { setLoading(false); }
  };

  // Yearly is the recommended path — gets the indigo primary CTA.
  // Monthly is secondary (graphite-on-white) so we don't burn the indigo budget.
  const isPrimary = !!recommended;

  // The featured plan carries the only indigo on the page: its edge and its button.
  // The featured plan swaps the card's hairline for an accent edge.
  const cardClass = recommended && !isCurrentPlan
    // ds-ignore: surface-card's fill and radius with an accent edge in place of its hairline; surface-card's own box-shadow would compete with the accent one
    ? 'rounded-xl bg-[var(--lume-surface-raised)] shadow-[inset_0_0_0_1.5px_var(--lume-accent)]'
    : 'surface-card';

  const renderButton = () => {
    if (isOperator) {
      return (
        <p className="mt-6 text-sm text-[var(--lume-text-secondary)]">
          Contatta il proprietario del salone per attivare l&apos;abbonamento.
        </p>
      );
    }

    if (isCurrentPlan) {
      return (
        <Button
          variant="secondary"
          leadingIcon={Check}
          disabled
          className="mt-6"
        >
          Il tuo piano attuale
        </Button>
      );
    }

    if (hasActiveSub) {
      return (
        <Button
          variant="secondary"
          loading={loading}
          leadingIcon={CreditCard}
          onClick={handleChangePlan}
          className="mt-6"
        >
          Cambia piano
        </Button>
      );
    }

    if (isPrimary) {
      return (
        <Button
          variant="primary"
          loading={loading}
          leadingIcon={CreditCard}
          onClick={handleSubscribe}
          className="mt-6"
        >
          Abbonati
        </Button>
      );
    }

    // Secondary CTA for the non-recommended monthly plan during trial.
    return (
      <Button
        variant="secondary"
        loading={loading}
        leadingIcon={CreditCard}
        onClick={handleSubscribe}
        className="mt-6"
      >
        Abbonati
      </Button>
    );
  };

  const badge = 'badge' in plan && plan.badge ? plan.badge : null;

  return (
    <div className={`flex flex-col p-6 sm:p-8 ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">{plan.name}</h3>
        {isCurrentPlan ? (
          <StatusDot tone="success" className="text-xs">Piano attivo</StatusDot>
        ) : badge ? (
          <span className="text-xs text-[var(--lume-text-secondary)] whitespace-nowrap">{badge}</span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">{plan.description}</p>
      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="tabular-nums text-4xl leading-none font-normal tracking-tight text-[var(--lume-text)]">{plan.price} €</span>
        <span className="text-sm text-[var(--lume-text-secondary)]">al {plan.interval}</span>
      </div>
      {renderButton()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Referral section — kept structurally similar but with semantic tokens, no
// gradient (DESIGN.md sanctions only --lume-gradient-hero / -accent), and a
// new gating-explainer line so trial-day-1 owners understand why "Riscattati"
// is 0.
// ─────────────────────────────────────────────────────────────────────────────
function ReferralStatusBadge({ status }: { status: Referral['status'] }) {
  if (status === 'pending') {
    return (
      <StatusDot tone="warning" className="text-sm">In attesa</StatusDot>
    );
  }
  return (
    <StatusDot tone="success" className="text-sm">Riscattato</StatusDot>
  );
}

function ReferralSection() {
  const referralCode   = useSubscriptionStore((s) => s.referralCode);
  const pendingCredits = useSubscriptionStore((s) => s.pendingCredits);
  const earnedCredits  = useSubscriptionStore((s) => s.earnedCredits);
  const referrals      = useSubscriptionStore((s) => s.referrals);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const total = referrals.length;
  const cap = 6;

  return (
    <section className="overflow-hidden surface-card">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <Gift className="size-5 shrink-0 mt-0.5 text-[var(--lume-text-secondary)]" aria-hidden />
          <div>
            <h3 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Invita un collega</h3>
            <p className="mt-1 text-sm text-[var(--lume-text-secondary)] max-w-md">
              Quando un collega si abbona, ricevi un mese gratuito. Loro ottengono 15 giorni extra di prova.
            </p>
            <p className="mt-1 text-xs text-[var(--lume-text-muted)] max-w-md">
              Il credito si attiva quando tu e il tuo collega completate il primo pagamento.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center h-[var(--lume-control-h-md)] pointer-coarse:h-[var(--lume-control-h-lg)] rounded-lg bg-hover px-3 tabular-nums text-sm tracking-wider text-[var(--lume-text)] truncate select-all">
            {referralCode}
          </div>
          <Button
            variant="secondary"
            leadingIcon={copied ? Check : Copy}
            onClick={handleCopy}
            aria-label="Copia codice"
          >
            {copied ? 'Copiato' : 'Copia'}
          </Button>
        </div>

        <StatRow className="mt-6 grid-cols-3!">
          <Stat label="Inviti totali" value={String(total)} />
          <Stat label="In attesa" value={String(pendingCredits)}
            marker={<span className="size-1.5 rounded-full bg-warning-strong" aria-hidden />} />
          <Stat label="Riscattati" value={`${earnedCredits}/${cap}`}
            marker={<span className="size-1.5 rounded-full bg-success-strong" aria-hidden />} />
        </StatRow>
      </div>

      <div className="border-t border-line">
        {referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <Sparkles className="size-5 text-[var(--lume-text-muted)]" aria-hidden />
            <p className="mt-3 text-sm font-medium text-[var(--lume-text)]">Nessun invito ancora</p>
            <p className="mt-1 text-sm text-[var(--lume-text-secondary)] max-w-xs">
              Condividi il tuo codice per iniziare a guadagnare mesi gratuiti.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Store className="size-4 shrink-0 text-[var(--lume-text-muted)]" aria-hidden />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[var(--lume-text)]">
                      {r.salonName}
                    </div>
                    <div className="text-xs text-[var(--lume-text-secondary)]">
                      Invitato il {formatDateDisplay(r.createdAt)}
                      {r.status === 'applied' && r.newPeriodEnd && (
                        <span>
                          {' · +1 mese · prossimo addebito al '}
                          {formatDateDisplay(r.newPeriodEnd)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ReferralStatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State A — Trial / not-yet-paid: conversion page.
// ─────────────────────────────────────────────────────────────────────────────
function TrialState({ trialEndDate }: { trialEndDate: string | null }) {
  const role = useSubscriptionStore((s) => s.role);
  const isOperator = role === 'operator';

  return (
    <>
      <TrialChip />
      {trialEndDate && (
        <p className="-mt-3 text-sm text-[var(--lume-text-secondary)]">
          Nessun pagamento richiesto fino al {trialEndDate}.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          planKey="monthly"
          isCurrentPlan={false}
          isOperator={isOperator}
          hasActiveSub={false}
        />
        <PlanCard
          planKey="yearly"
          recommended
          isCurrentPlan={false}
          isOperator={isOperator}
          hasActiveSub={false}
        />
      </div>

      <InvoiceList />

      <ReferralSection />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State C — Trial expired or subscription canceled: re-subscribe page.
// Distinct from TrialState so canceled salons don't see a misleading
// "X giorni rimanenti" chip when their access has actually ended.
// ─────────────────────────────────────────────────────────────────────────────
function ExpiredState({ wasCanceled }: { wasCanceled: boolean }) {
  const role = useSubscriptionStore((s) => s.role);
  const isOperator = role === 'operator';

  return (
    <>
      <Callout tone="warning" title={wasCanceled ? 'Abbonamento terminato.' : 'Prova gratuita scaduta.'}>
        {isOperator
          ? 'Contatta il proprietario del salone per riattivare l’accesso.'
          : 'Scegli un piano per riprendere a usare Lume.'}
      </Callout>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          planKey="monthly"
          isCurrentPlan={false}
          isOperator={isOperator}
          hasActiveSub={false}
        />
        <PlanCard
          planKey="yearly"
          recommended
          isCurrentPlan={false}
          isOperator={isOperator}
          hasActiveSub={false}
        />
      </div>

      <InvoiceList />

      <ReferralSection />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// State B — Active subscription: billing home.
// ─────────────────────────────────────────────────────────────────────────────
function ActiveState() {
  const role = useSubscriptionStore((s) => s.role);
  const cancelAt = useSubscriptionStore((s) => s.cancelAt);
  const availablePlanChange = useSubscriptionStore((s) => s.availablePlanChange);
  const isOwner = role === 'owner';

  const [showCancel, setShowCancel] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { setPortalLoading(false); }
  };

  const upgradeToYearly = async () => {
    setUpgradeLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'switch-to-yearly' }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setUpgradeLoading(false);
    } catch { setUpgradeLoading(false); }
  };

  return (
    <>
      <ReactivateBanner />
      <SubscriptionSummaryCard />

      <InvoiceList />

      {isOwner && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {availablePlanChange === 'upgrade-yearly' && (
              <Button
                variant="secondary"
                size="sm"
                loading={upgradeLoading}
                leadingIcon={Crown}
                onClick={upgradeToYearly}
              >
                Passa al piano annuale
              </Button>
            )}
            {!cancelAt && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCancel(true)}
              >
                Annulla abbonamento
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={portalLoading}
            leadingIcon={ExternalLink}
            onClick={openPortal}
          >
            Apri portale Stripe per fatturazione, IVA, dati di contatto
          </Button>
        </div>
      )}

      <ReferralSection />

      <CancelSubscriptionModal isOpen={showCancel} onClose={() => setShowCancel(false)} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page shell — handles loading + post-checkout polling, then branches by state.
// ─────────────────────────────────────────────────────────────────────────────
export default function SubscribePage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const isActive = useSubscriptionStore((s) => s.isActive);
  const isTrialing = useSubscriptionStore((s) => s.isTrialing);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const subscriptionStatus = useSubscriptionStore((s) => s.subscriptionStatus);
  const trialEndsAt = useSubscriptionStore((s) => s.trialEndsAt);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);

  const [isPolling, setIsPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const hasStartedPolling = useRef(false);

  useEffect(() => {
    if (!success || isActive || hasStartedPolling.current || pollTimedOut) return;
    hasStartedPolling.current = true;
    pollCountRef.current = 0;
    queueMicrotask(() => setIsPolling(true));
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      await fetchSubscription();
      if (!pollRef.current) return;
      const currentState = useSubscriptionStore.getState();
      if (currentState.isActive) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setIsPolling(false);
      } else if (pollCountRef.current >= 15) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setIsPolling(false);
        setPollTimedOut(true);
      }
    }, 2000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [success, isActive, pollTimedOut, fetchSubscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin motion-reduce:animate-none text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  // Trial end date for the helper line — comes straight from the API so we
  // never call Date.now() during render (react-hooks/purity).
  const trialEndDate = isTrialing && trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('it-IT', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Abbonamento"
        subtitle={isActive ? 'Piano, prossimo addebito e storico fatture.' : 'Scegli il piano più adatto al tuo salone.'}
      />

      {success && isPolling && (
        <Callout tone="info" icon={Loader2} iconClassName="animate-spin motion-reduce:animate-none" title="Stiamo attivando il tuo abbonamento..." />
      )}

      {success && isActive && !isPolling && (
        <Callout tone="success" title="Abbonamento attivato con successo!">
          Ora hai accesso completo a tutte le funzionalità di Lume.
        </Callout>
      )}

      {success && pollTimedOut && !isActive && (
        <Callout tone="warning" icon={Clock3}>
          L&apos;attivazione potrebbe richiedere qualche istante. Ricarica la pagina tra poco.
        </Callout>
      )}

      {subscriptionStatus === 'past_due' && <PastDueChip />}

      {isActive ? (
        <ActiveState />
      ) : isTrialing ? (
        <TrialState trialEndDate={trialEndDate} />
      ) : (
        <ExpiredState wasCanceled={subscriptionStatus === 'canceled'} />
      )}
    </div>
  );
}
