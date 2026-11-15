'use client';

import { useState, useEffect } from 'react';
import { User, AtSign, Phone, Archive, ArchiveRestore } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { Button } from '@/lib/components/shared/ui/Button';
import type { Operator } from '@/lib/types/Operator';

interface EditOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedOperator: Partial<Operator>;
  onEditedOperatorChange: (o: Partial<Operator>) => void;
  selectedOperator: Operator | null;
}

const emptyErrors = () => ({ firstName: '', lastName: '', email: '', phone: '' });

export function EditOperatorModal({ isOpen, onClose, editedOperator, onEditedOperatorChange, selectedOperator }: EditOperatorModalProps) {
  const updateOperator = useOperatorsStore((s) => s.updateOperator);
  const archiveOperator = useOperatorsStore((s) => s.archiveOperator);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);
  const [errors, setErrors] = useState(emptyErrors());

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrors(emptyErrors());
    }
  }, [isOpen]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedOperatorChange({ ...editedOperator, [key]: value });

  const handleSubmit = async () => {
    if (!selectedOperator) return;

    const e = emptyErrors();
    if (!editedOperator.firstName) e.firstName = 'Inserisci un nome';
    if (!editedOperator.lastName) e.lastName = 'Inserisci un cognome';
    // Email is required only for operators with a linked auth account — clearing it
    // would orphan the auth identity. No-auth operators may keep email blank.
    const hadAccount = !!selectedOperator.user_id;
    if (hadAccount && !editedOperator.email) e.email = 'Inserisci un email';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { password: _pw, ...toUpdate } = editedOperator as any;
      await updateOperator(selectedOperator.id, { ...selectedOperator, ...toUpdate });
      messagePopup.getState().success('Operatore aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedOperator) return;
    try {
      if (selectedOperator.isArchived) {
        await restoreOperator(selectedOperator.id);
        messagePopup.getState().success('Operatore ripristinato.');
      } else {
        await archiveOperator(selectedOperator.id);
        messagePopup.getState().success('Operatore archiviato.');
      }
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  const isArchived = selectedOperator?.isArchived ?? false;
  // When the operator is linked to a Lume account, identity fields are owned
  // by that user's Profilo and synced server-side via /api/preferences. Keep
  // them read-only here so the salon owner can't shadow-edit someone's profile.
  const linkedToUser = !!selectedOperator?.user_id;


  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Modifica Operatore"
      subtitle="Aggiorna i dati dell'operatore"
      confirmText="Salva"
      classes="max-w-2xl"
      footerContent={
        <Button
          variant="secondary"
          leadingIcon={isArchived ? ArchiveRestore : Archive}
          onClick={handleToggleArchive}
        >
          {isArchived ? 'Ripristina' : 'Archivia'}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {linkedToUser && (
          <Callout>
            Nome, email, telefono e immagine sono modificati da questo operatore dal proprio profilo.
          </Callout>
        )}

        <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
          <FormInput
            fieldClassName="grow"
            label="Nome"
            labelIcon={User}
            required
            value={editedOperator.firstName ?? ''}
            onChange={(e) => set('firstName', e.target.value)}
            disabled={linkedToUser}
            error={errors.firstName || undefined}
          />
          <FormInput
            fieldClassName="grow"
            label="Cognome"
            labelIcon={User}
            required
            value={editedOperator.lastName ?? ''}
            onChange={(e) => set('lastName', e.target.value)}
            disabled={linkedToUser}
            error={errors.lastName || undefined}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6 w-full">
          <FormInput
            fieldClassName="flex-1"
            label="Email"
            labelIcon={AtSign}
            required={linkedToUser}
            type="email"
            value={editedOperator.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="off"
            disabled={linkedToUser}
            error={errors.email || undefined}
          />
          <Field className="flex-1" label="Telefono" labelIcon={Phone} error={errors.phone || undefined}>
            {({ id, invalid }) => (
              <PhoneNumber
                id={id}
                invalid={invalid}
                prefixCode={editedOperator.phonePrefix ?? '+39'}
                phoneNumber={editedOperator.phoneNumber ?? ''}
                onPrefixChange={(v) => set('phonePrefix', v)}
                onPhoneChange={(v) => set('phoneNumber', v)}
                disabled={linkedToUser}
              />
            )}
          </Field>
        </div>
      </div>
    </AddModal>
  );
}
