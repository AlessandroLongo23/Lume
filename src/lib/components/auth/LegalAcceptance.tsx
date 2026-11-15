'use client';

import { TextLink } from '@/lib/components/shared/ui/TextLink';
import { CheckboxRow } from '@/lib/components/shared/ui/forms/CheckboxRow';
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
    <fieldset className="space-y-3 rounded-xl bg-hover p-4">
      <legend className="px-1 text-xs font-medium text-[var(--lume-text-secondary)]">
        Accettazione contrattuale
      </legend>

      <CheckboxRow
        checked={acceptedTerms}
        onChange={(v) => setField('acceptedTerms', v)}
        label={
          <>
            Ho letto e accetto i{' '}
            <TextLink href="/terms" target="_blank">
              Termini di servizio
            </TextLink>{' '}
            e l&apos;
            <TextLink href="/privacy" target="_blank">
              Informativa sulla privacy
            </TextLink>
            .
          </>
        }
      />

      <CheckboxRow
        checked={acceptedVessatorie}
        onChange={(v) => setField('acceptedVessatorie', v)}
        label={
          <>
            Ai sensi e per gli effetti degli artt. <strong>1341 e 1342 c.c.</strong>, dopo averne
            presa attenta visione, approvo specificamente le seguenti clausole dei{' '}
            <TextLink href="/terms#16" target="_blank">
              Termini
            </TextLink>
            : <strong>5</strong> (sospensione per mancato pagamento), <strong>6</strong> (rinnovo
            tacito ed esclusione recesso consumeristico), <strong>7</strong> (sospensione e
            cessazione unilaterali), <strong>10</strong> (assenza SLA), <strong>12</strong>{' '}
            (limitazione di responsabilit&agrave;), <strong>13</strong> (modifiche unilaterali),{' '}
            <strong>14</strong> (legge danese e foro di Copenhagen).
          </>
        }
      />

      <CheckboxRow
        checked={acceptedDpa}
        onChange={(v) => setField('acceptedDpa', v)}
        label={
          <>
            Nomino Lume <strong>responsabile del trattamento</strong> dei dati dei miei clienti ai
            sensi dell&apos;art. 28 GDPR e accetto il{' '}
            <TextLink href="/dpa" target="_blank">
              Data Processing Agreement
            </TextLink>
            .
          </>
        }
      />
    </fieldset>
  );
}

// Helper used by the parent step to gate the submit button.
export function useLegalAccepted(): boolean {
  return useOnboardingStore((s) => s.acceptedTerms && s.acceptedVessatorie && s.acceptedDpa);
}
