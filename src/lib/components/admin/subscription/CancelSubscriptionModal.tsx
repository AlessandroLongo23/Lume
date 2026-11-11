'use client';

import { useId, useState } from 'react';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { Button } from '@/lib/components/shared/ui/Button';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { DialogFooter, DialogHeader } from '@/lib/components/shared/ui/modals/dialogParts';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import type { CancellationReason } from '@/lib/types/Subscription';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

const REASONS: { value: CancellationReason; label: string }[] = [
  { value: 'too_expensive',    label: 'Troppo costoso' },
  { value: 'missing_features', label: 'Mi mancano funzionalità' },
  { value: 'switched_tool',    label: 'Sono passato a un altro strumento' },
  { value: 'closing_salon',    label: 'Chiudo il salone' },
  { value: 'other',            label: 'Altro' },
];

const formatRenewalDate = (iso: string | null): string | null => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

export function CancelSubscriptionModal({ isOpen, onClose }: Props) {
  const subscriptionEndsAt = useSubscriptionStore((s) => s.subscriptionEndsAt);
  const cancel = useSubscriptionStore((s) => s.cancel);
  const titleId = useId();

  // Form state lives inside an inner component keyed by `isOpen` so each
  // open is a fresh mount (no reset-in-effect).
  return (
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-md" labelledBy={titleId}>
      <CancelDialogBody
        key={isOpen ? 'open' : 'closed'}
        titleId={titleId}
        onClose={onClose}
        cancel={cancel}
        subscriptionEndsAt={subscriptionEndsAt}
      />
    </Modal>
  );
}

interface BodyProps {
  titleId: string;
  onClose: () => void;
  cancel: ReturnType<typeof useSubscriptionStore.getState>['cancel'];
  subscriptionEndsAt: string | null;
}

function CancelDialogBody({ titleId, onClose, cancel, subscriptionEndsAt }: BodyProps) {
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    const result = await cancel(reason, comment.trim() || null);
    if (result.ok) {
      onClose();
    } else {
      setError(result.error ?? 'Errore durante l\'annullamento.');
      setSubmitting(false);
    }
  };

  const renewalDate = formatRenewalDate(subscriptionEndsAt);

  return (
    <>
      <DialogHeader
        titleId={titleId}
        title={<>Annullare l&apos;abbonamento?</>}
        subtitle={
          renewalDate
            ? <>Continuerai ad avere accesso fino al <strong className="font-medium text-[var(--lume-text)]">{renewalDate}</strong>. Puoi riattivare l&apos;abbonamento prima di quella data senza perdere nulla.</>
            : <>Continuerai ad avere accesso fino alla fine del periodo già pagato. Puoi riattivare l&apos;abbonamento prima senza perdere nulla.</>
        }
      />

      <div className="flex flex-col gap-5 px-6 pt-3 pb-5">
        <Field label="Perché annulli? (facoltativo)">
          {({ id }) => (
            <ListBox id={id} className="-mx-1">
              {REASONS.map((r) => {
                const selected = reason === r.value;
                return (
                  <ListRow
                    key={r.value}
                    selected={selected}
                    check
                    aria-pressed={selected}
                    onClick={() => setReason(selected ? null : r.value)}
                  >
                    {r.label}
                  </ListRow>
                );
              })}
            </ListBox>
          )}
        </Field>

        <TextArea
          aria-label="Cosa potremmo migliorare?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cosa potremmo migliorare? (facoltativo)"
          rows={3}
          maxLength={1000}
        />

        {error && (
          <Callout tone="danger">{error}</Callout>
        )}
      </div>

      <DialogFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Mantieni l&apos;abbonamento
        </Button>
        <Button variant="secondary" size="sm" onClick={handleConfirm} loading={submitting}>
          Annulla l&apos;abbonamento
        </Button>
      </DialogFooter>
    </>
  );
}
