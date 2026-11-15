'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { TextLink } from '@/lib/components/shared/ui/TextLink';

export function TrialWarningBanner() {
  const showTrialWarning = useSubscriptionStore((s) => s.showTrialWarning);
  const trialDaysLeft = useSubscriptionStore((s) => s.trialDaysLeft);
  const [dismissed, setDismissed] = useState(false);

  if (!showTrialWarning || dismissed) return null;

  const daysText = trialDaysLeft === 1 ? '1 giorno' : `${trialDaysLeft} giorni`;

  return (
    <Callout
      tone="warning"
      className="mb-4 items-center py-1 pr-1 min-h-11 [&>svg]:mt-0"
      action={
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Chiudi avviso"
          onClick={() => setDismissed(true)}
        >
          <X />
        </Button>
      }
    >
      <p className="text-[var(--lume-text)]">
        Il tuo periodo di prova scade tra <span className="font-medium">{daysText}</span>.{' '}
        <TextLink href="/admin/subscribe">Attiva un abbonamento</TextLink>{' '}
        per continuare a usare Lume.
      </p>
    </Callout>
  );
}
