'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle, Check, Copy, CreditCard, Gift, Loader2, Crown,
  Clock3, Sparkles, Store, ExternalLink,
} from 'lucide-react';
import { useSubscriptionStore, type Referral } from '@/lib/stores/subscription';
import { formatDateDisplay } from '@/lib/utils/format';
import { PLANS } from '@/lib/stripe/config';
import { SubscriptionSummaryCard } from '@/lib/components/admin/subscription/SubscriptionSummaryCard';
import { InvoiceList } from '@/lib/components/admin/subscription/InvoiceList';
import { CancelSubscriptionModal } from '@/lib/components/admin/subscription/CancelSubscriptionModal';
import { ReactivateBanner } from '@/lib/components/admin/subscription/ReactivateBanner';
import { Button } from '@/lib/components/shared/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
// Status badges (trial, past-due, expired) — Active state lives in
// SubscriptionSummaryCard, not here.
// ─────────────────────────────────────────────────────────────────────────────
function TrialChip() {
  const trialDaysLeft = useSubscriptionStore((s) => s.trialDaysLeft);
  const daysText = trialDaysLeft === 1 ? '1 giorno' : `${trialDaysLeft} giorni`;
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-primary">
      <Crown className="size-4" />
      Prova gratuita — {daysText} rimanenti
    </div>
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
    <div className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 flex items-center gap-3">
      <AlertTriangle className="size-5 text-warning-strong shrink-0" />
      <div className="flex-1 text-sm text-warning-strong">
        <strong className="font-medium">Pagamento non riuscito.</strong>{' '}
        Aggiorna il metodo di pagamento per non perdere l&apos;accesso.
      </div>
      <Button
        variant="primary"
        size="sm"
        loading={loading}
        leadingIcon={CreditCard}
        onClick={openPortal}
        className="shrink-0"
      >
        Aggiorna metodo
      </Button>
    </div>
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

  const borderClass = isCurrentPlan
    ? 'border-success-line shadow-sm'
    : recommended
      ? 'border-primary/40 shadow-sm'
      : 'border-border';

  const renderButton = () => {
    if (isOperator) {
      return (
        <p className="mt-6 text-center text-sm text-muted-foreground">
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
          className="mt-6 bg-success-soft text-success-strong border-success-line"
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

  const badgeContent = isCurrentPlan
    ? 'Piano attivo'
    : 'badge' in plan && plan.badge
      ? plan.badge
      : null;

  const badgeColor = isCurrentPlan
    ? 'bg-success-strong'
    : 'bg-primary';

  return (
    <div className={`relative flex flex-col rounded-xl border bg-card p-6 transition-shadow ${borderClass}`}>
      {badgeContent && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${badgeColor} px-3 py-1 text-xs font-semibold text-white`}>
          {badgeContent}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold text-foreground">€{plan.price}</span>
        <span className="text-sm text-muted-foreground">/{plan.interval}</span>
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning-strong">
        <Clock3 className="size-3" />
        In attesa
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success-strong">
      <Check className="size-3" />
      Riscattato
    </span>
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Quiet tonal lift, not a chromatic wash — keeps indigo as a rare event
          (the Gift icon tile is the only accent the section needs). */}
      <div className="bg-muted/40 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent-muted text-primary">
            <Gift className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Invita un collega</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md">
              Quando un collega si abbona, ricevi un mese gratuito. Loro ottengono 15 giorni extra di prova.
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">
              Il credito si attiva quando tu e il tuo collega completate il primo pagamento.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-sm font-medium tracking-wider text-foreground">
            {referralCode}
          </div>
          <Button
            variant="secondary"
            leadingIcon={copied ? Check : Copy}
            onClick={handleCopy}
            aria-label="Copia codice"
            className={copied ? 'text-success-strong' : ''}
          >
            {copied ? 'Copiato' : 'Copia'}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="text-xs text-muted-foreground">Inviti totali</div>
            <div className="mt-0.5 text-lg font-semibold text-foreground">{total}</div>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="text-xs text-muted-foreground">In attesa</div>
            <div className="mt-0.5 text-lg font-semibold text-warning-strong">{pendingCredits}</div>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="text-xs text-muted-foreground">Riscattati</div>
            <div className="mt-0.5 text-lg font-semibold text-success-strong">
              {earnedCredits}<span className="text-sm font-normal text-muted-foreground">/{cap}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        {referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Nessun invito ancora</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              Condividi il tuo codice per iniziare a guadagnare mesi gratuiti.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Store className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {r.salonName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Invitato il {formatDateDisplay(r.createdAt)}
                      {r.status === 'applied' && r.newPeriodEnd && (
                        <span className="text-success-strong">
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
    </div>
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
        <p className="text-sm text-muted-foreground">
          Nessun pagamento richiesto fino al {trialEndDate}.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
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
      <div className="rounded-xl border border-warning-line bg-warning-soft px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="size-5 text-warning-strong shrink-0 mt-0.5" />
        <div className="text-sm text-warning-strong">
          <strong className="font-medium">
            {wasCanceled ? 'Abbonamento terminato.' : 'Prova gratuita scaduta.'}
          </strong>{' '}
          {isOperator
            ? 'Contatta il proprietario del salone per riattivare l’accesso.'
            : 'Scegli un piano per riprendere a usare Lume.'}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
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
            className="text-xs"
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
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Abbonamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isActive
            ? 'Piano, prossimo addebito e storico fatture.'
            : 'Scegli il piano più adatto al tuo salone.'}
        </p>
      </div>

      {success && isPolling && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-accent-soft px-4 py-3 text-sm text-primary">
          <Loader2 className="size-4 animate-spin shrink-0" />
          Stiamo attivando il tuo abbonamento...
        </div>
      )}

      {success && isActive && !isPolling && (
        <div className="rounded-lg border border-success-line bg-success-soft px-4 py-3 text-sm text-success-strong">
          <strong>Abbonamento attivato con successo!</strong> Ora hai accesso completo a tutte le funzionalità di Lume.
        </div>
      )}

      {success && pollTimedOut && !isActive && (
        <div className="rounded-lg border border-warning-line bg-warning-soft px-4 py-3 text-sm text-warning-strong">
          L&apos;attivazione potrebbe richiedere qualche istante. Ricarica la pagina tra poco.
        </div>
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
