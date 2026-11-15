'use client';

import { useState, useEffect } from 'react';
import { User, AtSign, Phone, Lock } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';

interface AddOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyOp = () => ({ firstName: '', lastName: '', email: '', password: '', phonePrefix: '+39', phoneNumber: '' });
const emptyErrors = () => ({ firstName: '', lastName: '', email: '', password: '', phone: '' });

export function AddOperatorModal({ isOpen, onClose }: AddOperatorModalProps) {
  const operators = useOperatorsStore((s) => s.operators);
  const addOperator = useOperatorsStore((s) => s.addOperator);
  const [op, setOp] = useState(emptyOp());
  const [errors, setErrors] = useState(emptyErrors());

  useEffect(() => {
    if (isOpen) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const randomPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOp({ ...emptyOp(), password: randomPassword });
      setErrors(emptyErrors());
    }
  }, [isOpen, operators.length]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setOp((o) => ({ ...o, [key]: value }));

  // No-auth operator: created for fiches/statistics only, cannot log in.
  // Triggered when both email and password are blank.
  const willCreateAccount = !!op.email.trim();

  const handleSubmit = async () => {
    const e = emptyErrors();
    if (!op.firstName.trim()) e.firstName = 'Inserisci un nome';
    if (!op.lastName.trim()) e.lastName = 'Inserisci un cognome';
    if (willCreateAccount && op.password.length < 8) e.password = 'La password deve contenere almeno 8 caratteri.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      const payload = willCreateAccount ? { ...op } : { ...op, password: '' };
      const result = await addOperator(payload);
      const msg = result.invited
        ? "Se l'email è già registrata su Lume, l'operatore riceverà un invito a unirsi al tuo salone. Altrimenti, l'account è stato creato con la password indicata."
        : 'Operatore aggiunto con successo';
      messagePopup.getState().success(msg);
      // Advances an interactive guide's "save" step on a successful create.
      emitTourEvent('operator:created');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error("Errore durante la creazione dell'operatore: " + msg);
    }
  };


  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuovo operatore"
      subtitle="Aggiungi un nuovo operatore"
      classes="max-w-2xl"
      confirmDataTour="save-operator"
      // Emit only after the open animation settles, so the guide's next step
      // (anchored on a field inside the modal) measures its final position.
      onEnterComplete={() => emitTourEvent('operator:modal-open')}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
          <FormInput
            fieldClassName="grow"
            label="Nome"
            labelIcon={User}
            required
            data-tour="field-operator-first_name"
            value={op.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            error={errors.firstName || undefined}
          />
          <FormInput
            fieldClassName="grow"
            label="Cognome"
            labelIcon={User}
            required
            data-tour="field-operator-last_name"
            value={op.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            error={errors.lastName || undefined}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
          <FormInput
            fieldClassName="flex-1"
            label="Email"
            labelIcon={AtSign}
            type="email"
            data-tour="field-operator-email"
            value={op.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="off"
            error={errors.email || undefined}
          />
          <div className="flex-1 min-w-0" data-tour="field-operator-phone">
            <Field label="Telefono" labelIcon={Phone} error={errors.phone || undefined}>
              {({ id, invalid }) => (
                <PhoneNumber
                  id={id}
                  invalid={invalid}
                  prefixCode={op.phonePrefix}
                  phoneNumber={op.phoneNumber}
                  onPrefixChange={(v) => set('phonePrefix', v)}
                  onPhoneChange={(v) => set('phoneNumber', v)}
                />
              )}
            </Field>
          </div>
        </div>

        {willCreateAccount && (
          // Shown in clear: the owner reads the generated password to hand it over.
          <FormInput
            label="Password App"
            labelIcon={Lock}
            required
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={op.password}
            onChange={(e) => set('password', e.target.value)}
            error={errors.password || undefined}
          />
        )}

        {!willCreateAccount && (
          <Callout>
            L&apos;operatore esisterà per assegnare prestazioni e statistiche, ma non potrà accedere al gestionale. Potrai aggiungere le credenziali in seguito dalla scheda dell&apos;operatore.
          </Callout>
        )}
      </div>
    </AddModal>
  );
}
