'use client';

import Link from 'next/link';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { useOnboardingStore } from '@/lib/stores/onboarding';

// Three required gates for compliant signup:
// 1. ToS + Privacy (general acceptance)
// 2. Vessatorie clauses (artt. 1341/1342 c.c. — separate, prominent, list each by number)
// 3. DPA (art. 28 GDPR — salon = Titolare, Lume = Responsabile)
//
// All three must be checked before /api/register is allowed to create the salon.
export function LegalAcceptance() {
  const acceptedTerms = useOnboardingStore((s) => s.acceptedTerms);
  const acceptedVessatorie = useOnboardingStore((s) => s.acceptedVessatorie);
  const acceptedDpa = useOnboardingStore((s) => s.acceptedDpa);
  const setField = useOnboardingStore((s) => s.setField);

  return (
    <fieldset className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
      <legend className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Accettazione contrattuale
      </legend>

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          size="sm"
          checked={acceptedTerms}
          onChange={(e) => setField('acceptedTerms', e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm leading-snug text-foreground">
          Ho letto e accetto i{' '}
          <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
            Termini di servizio
          </Link>{' '}
          e l&apos;
          <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
            Informativa sulla privacy
          </Link>
          .
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          size="sm"
          checked={acceptedVessatorie}
          onChange={(e) => setField('acceptedVessatorie', e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm leading-snug text-foreground">
          Ai sensi e per gli effetti degli artt. <strong>1341 e 1342 c.c.</strong>, dopo averne
          presa attenta visione, approvo specificamente le seguenti clausole dei{' '}
          <Link href="/terms#16" target="_blank" className="text-primary underline underline-offset-2">
            Termini
          </Link>
          : <strong>5</strong> (sospensione per mancato pagamento), <strong>6</strong> (rinnovo
          tacito ed esclusione recesso consumeristico), <strong>7</strong> (sospensione e
          cessazione unilaterali), <strong>10</strong> (assenza SLA), <strong>12</strong>{' '}
          (limitazione di responsabilit&agrave;), <strong>13</strong> (modifiche unilaterali),{' '}
          <strong>14</strong> (legge danese e foro di Copenhagen).
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <Checkbox
          size="sm"
          checked={acceptedDpa}
          onChange={(e) => setField('acceptedDpa', e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm leading-snug text-foreground">
          Nomino Lume <strong>responsabile del trattamento</strong> dei dati dei miei clienti ai
          sensi dell&apos;art. 28 GDPR e accetto il{' '}
          <Link href="/dpa" target="_blank" className="text-primary underline underline-offset-2">
            Data Processing Agreement
          </Link>
          .
        </span>
      </label>
    </fieldset>
  );
}

// Helper used by the parent step to gate the submit button.
export function useLegalAccepted(): boolean {
  return useOnboardingStore((s) => s.acceptedTerms && s.acceptedVessatorie && s.acceptedDpa);
}
