'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Check, Copy, CreditCard, Gift, Loader2, Crown } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { PLANS } from '@/lib/stripe/config';

function StatusBadge() {
  const isActive = useSubscriptionStore((s) => s.isActive);
  const isTrialing = useSubscriptionStore((s) => s.isTrialing);
  const isExpired = useSubscriptionStore((s) => s.isExpired);
  const trialDaysLeft = useSubscriptionStore((s) => s.trialDaysLeft);
  const subscriptionPlan = useSubscriptionStore((s) => s.subscriptionPlan);
  const subscriptionEndsAt = useSubscriptionStore((s) => s.subscriptionEndsAt);
  const subscriptionStatus = useSubscriptionStore((s) => s.subscriptionStatus);

  if (isActive) {
    const planLabel = subscriptionPlan === 'yearly' ? 'Annuale' : 'Mensile';
    const renewalDate = subscriptionEndsAt
      ? new Date(subscriptionEndsAt).toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

    return (
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <Check className="w-4 h-4" />
          Abbonamento {planLabel} attivo
        </div>
        {renewalDate && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-1">
            Si rinnova il {renewalDate}
          </p>
        )}
      </div>
    );
  }

  if (subscriptionStatus === 'past_due') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
        <AlertTriangle className="w-4 h-4" />
        Pagamento non riuscito — aggiorna il metodo di pagamento
      </div>
    );
  }

  if (isTrialing) {
    const daysText = trialDaysLeft === 1 ? '1 giorno' : `${trialDaysLeft} giorni`;
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
        <Crown className="w-4 h-4" />
        Prova gratuita — {daysText} rimanenti
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
        Periodo di prova scaduto
      </div>
    );
  }

  return null;
}

function PlanCard({
  plan,
  planKey,
  recommended,
  isCurrentPlan,
}: {
  plan: typeof PLANS.monthly | typeof PLANS.yearly;
  planKey: 'monthly' | 'yearly';
  recommended?: boolean;
  isCurrentPlan: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const role = useSubscriptionStore((s) => s.role);
  const isActive = useSubscriptionStore((s) => s.isActive);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  const isOperator = role === 'operator';

  const borderClass = isCurrentPlan
    ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5'
    : recommended
      ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/5'
      : 'border-zinc-200 dark:border-zinc-800';

  const badgeContent = isCurrentPlan
    ? 'Piano attivo'
    : 'badge' in plan && plan.badge
      ? plan.badge
      : null;

  const badgeColor = isCurrentPlan
    ? 'bg-emerald-500'
    : 'bg-indigo-500';

  const renderButton = () => {
    if (isOperator) {
      return (
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Contatta il proprietario del salone per attivare l&apos;abbonamento.
        </p>
      );
    }

    if (isCurrentPlan) {
      return (
        <button
          disabled
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-default"
        >
          <Check className="w-4 h-4" />
          Il tuo piano attuale
        </button>
      );
    }

    if (isActive) {
      return (
        <button
          onClick={handleChangePlan}
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Cambia piano
        </button>
      );
    }

    return (
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        Abbonati
      </button>
    );
  };

  return (
    <div className={`relative flex flex-col rounded-xl border p-6 transition-shadow ${borderClass}`}>
      {badgeContent && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${badgeColor} px-3 py-1 text-xs font-semibold text-white`}>
          {badgeContent}
        </div>
      )}

      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{plan.name}</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-zinc-900 dark:text-white">&euro;{plan.price}</span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">/{plan.interval}</span>
      </div>

      {renderButton()}
    </div>
  );
}

function ReferralSection() {
  const referralCode = useSubscriptionStore((s) => s.referralCode);
  const pendingCredits = useSubscriptionStore((s) => s.pendingCredits);
  const earnedCredits = useSubscriptionStore((s) => s.earnedCredits);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Invita un collega</h3>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Condividi il tuo codice con altri professionisti. Quando si abbonano, ricevi
        un mese gratuito. Loro ottengono 15 giorni extra di prova!
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-4 py-2.5 font-mono text-sm tracking-wider text-zinc-900 dark:text-white">
          {referralCode}
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          aria-label="Copia codice"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4 text-zinc-500" />
          )}
        </button>
      </div>

      {(pendingCredits > 0 || earnedCredits > 0) && (
        <div className="mt-4 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          {pendingCredits > 0 && (
            <span>{pendingCredits} referral in attesa</span>
          )}
          {earnedCredits > 0 && (
            <span>{earnedCredits}/6 crediti guadagnati</span>
          )}
        </div>
      )}
    </div>
  );
}

function ManageSection() {
  const isActive = useSubscriptionStore((s) => s.isActive);
  const role = useSubscriptionStore((s) => s.role);
  const [loading, setLoading] = useState(false);

  if (!isActive || role !== 'owner') return null;

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Gestisci abbonamento
    </button>
  );
}

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const isActive = useSubscriptionStore((s) => s.isActive);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const subscriptionPlan = useSubscriptionStore((s) => s.subscriptionPlan);
  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);

  const [isPolling, setIsPolling] = useState(false);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // Poll for subscription activation after successful checkout
  useEffect(() => {
    if (!success || isActive || isPolling || pollTimedOut) return;

    setIsPolling(true);
    pollCountRef.current = 0;

    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      await fetchSubscription();

      const currentState = useSubscriptionStore.getState();
      if (currentState.isActive) {
        if (pollRef.current) clearInterval(pollRef.current);
        setIsPolling(false);
      } else if (pollCountRef.current >= 15) {
        if (pollRef.current) clearInterval(pollRef.current);
        setIsPolling(false);
        setPollTimedOut(true);
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [success, isActive, isPolling, pollTimedOut, fetchSubscription]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Abbonamento</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Scegli il piano pi&ugrave; adatto al tuo salone.
        </p>
      </div>

      {success && isPolling && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Stiamo attivando il tuo abbonamento...
        </div>
      )}

      {success && isActive && !isPolling && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
          <strong>Abbonamento attivato con successo!</strong> Ora hai accesso completo a tutte le funzionalit&agrave; di Lume.
        </div>
      )}

      {success && pollTimedOut && !isActive && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          L&apos;attivazione potrebbe richiedere qualche istante. Ricarica la pagina tra poco.
        </div>
      )}

      <StatusBadge />

      <div className="grid gap-6 sm:grid-cols-2">
        <PlanCard
          plan={PLANS.monthly}
          planKey="monthly"
          isCurrentPlan={isActive && subscriptionPlan === 'monthly'}
        />
        <PlanCard
          plan={PLANS.yearly}
          planKey="yearly"
          recommended
          isCurrentPlan={isActive && subscriptionPlan === 'yearly'}
        />
      </div>

      <ManageSection />
      <ReferralSection />
    </div>
  );
}
