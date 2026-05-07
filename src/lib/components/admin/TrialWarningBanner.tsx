'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';

export function TrialWarningBanner() {
  const showTrialWarning = useSubscriptionStore((s) => s.showTrialWarning);
  const trialDaysLeft = useSubscriptionStore((s) => s.trialDaysLeft);
  const [dismissed, setDismissed] = useState(false);

  if (!showTrialWarning || dismissed) return null;

  const daysText = trialDaysLeft === 1 ? '1 giorno' : `${trialDaysLeft} giorni`;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Il tuo periodo di prova scade tra <strong>{daysText}</strong>.{' '}
          <Link
            href="/admin/subscribe"
            className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
          >
            Attiva un abbonamento
          </Link>{' '}
          per continuare a usare Lume.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label="Chiudi avviso"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
      >
        <X />
      </Button>
    </div>
  );
}
