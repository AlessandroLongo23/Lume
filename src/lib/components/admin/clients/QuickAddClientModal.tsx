'use client';

import { useEffect, useState } from 'react';
import { User } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { useFormDefaults } from '@/lib/hooks/useFormDefaults';
import type { Client } from '@/lib/types/Client';

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-fill first name (e.g. from the "+ Crea «...»" search row). */
  initialFirstName?: string;
  /** Pre-fill last name. */
  initialLastName?: string;
  /** Fired after the new client has been created and added to the store. */
  onCreated?: (client: Client) => void;
}

export function QuickAddClientModal({
  isOpen,
  onClose,
  initialFirstName = '',
  initialLastName = '',
  onCreated,
}: QuickAddClientModalProps) {
  const addClient = useClientsStore((s) => s.addClient);
  const formDefaults = useFormDefaults();

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phonePrefix, setPhonePrefix] = useState(formDefaults.client_phone_prefix);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setPhonePrefix(formDefaults.client_phone_prefix);
    setPhoneNumber('');
    setErrors({});
  }, [isOpen, initialFirstName, initialLastName, formDefaults.client_phone_prefix]);

  const handleSubmit = async () => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    if (!firstName.trim()) newErrors.firstName = 'Inserisci un nome';
    if (!lastName.trim()) newErrors.lastName = 'Inserisci un cognome';
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      const trimmedPhone = phoneNumber.trim();
      const newClient = await addClient(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phonePrefix: trimmedPhone ? phonePrefix : null,
          phoneNumber: trimmedPhone || null,
        },
        { createAccount: false, source: 'fiche_quick_add' },
      );
      messagePopup.getState().success('Cliente aggiunto con successo');
      onCreated?.(newClient);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione del cliente: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuovo cliente"
      subtitle="Aggiunta rapida — nome e telefono"
      classes="max-w-lg"
      confirmDisabled={isSubmitting}
      closeOnOutsideClick={false}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Nome"
            icon={<User className="size-4" />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            required
            autoFocus
          />
          <FormInput
            label="Cognome"
            icon={<User className="size-4" />}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Telefono <span className="text-muted-foreground font-normal">(opzionale)</span>
          </label>
          <PhoneNumber
            prefixCode={phonePrefix}
            phoneNumber={phoneNumber}
            onPrefixChange={setPhonePrefix}
            onPhoneChange={setPhoneNumber}
          />
        </div>
      </div>
    </AddModal>
  );
}
