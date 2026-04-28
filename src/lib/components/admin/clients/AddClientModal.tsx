'use client';

import { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { ClientForm, validateBirthDate, type ClientFormValue, type ClientFormErrors } from './ClientForm';
import { Gender } from '@/lib/types/Gender';
import { useFormDefaults } from '@/lib/hooks/useFormDefaults';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyClient = (defaults: { phonePrefix: string; gender: Gender }): ClientFormValue => ({
  firstName: '',
  lastName: '',
  gender: defaults.gender,
  email: '',
  password: '',
  phonePrefix: defaults.phonePrefix,
  phoneNumber: '',
  isTourist: false,
  birthDate: '',
  note: '',
});

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const clients = useClientsStore((s) => s.clients);
  const addClient = useClientsStore((s) => s.addClient);
  const formDefaults = useFormDefaults();
  const seedDefaults = {
    phonePrefix: formDefaults.client_phone_prefix,
    gender: formDefaults.client_default_gender === 'F' ? Gender.FEMALE : Gender.MALE,
  };

  const [client, setClient] = useState<ClientFormValue>(() => emptyClient(seedDefaults));
  const [errors, setErrors] = useState<ClientFormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setClient({ ...emptyClient(seedDefaults), password: String(clients.length + 1).padStart(6, '0') });
      setErrors({});
    }
  // seedDefaults is rebuilt every render from primitives below; depend on those.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clients.length, formDefaults.client_phone_prefix, formDefaults.client_default_gender]);

  const handleSubmit = async () => {
    const newErrors: ClientFormErrors = {};
    if (!client.firstName?.trim()) newErrors.firstName = 'Inserisci un nome';
    if (!client.lastName?.trim()) newErrors.lastName = 'Inserisci un cognome';
    if (!client.email && !client.phoneNumber) {
      newErrors.email = "Inserisci almeno un'email o un telefono";
      newErrors.phoneNumber = "Inserisci almeno un'email o un telefono";
    }
    if (!client.password) newErrors.password = 'Inserisci una password';
    if (!client.gender) newErrors.gender = 'Seleziona un genere';
    if (client.birthDate) {
      const err = validateBirthDate(client.birthDate);
      if (err) newErrors.birthDate = err;
    }
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    let formattedBirthDate: string | null = null;
    if (client.birthDate) {
      const parsed = parse(client.birthDate, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) formattedBirthDate = format(parsed, 'yyyy-MM-dd');
    }

    try {
      await addClient({ ...client, birthDate: formattedBirthDate ?? undefined });
      messagePopup.getState().success('Cliente aggiunto con successo');
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione del cliente: ' + msg);
    }
  };

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuovo cliente" subtitle="Aggiungi un nuovo cliente" classes="max-w-3xl">
      <ClientForm value={client} onChange={setClient} errors={errors} showNote />
    </AddModal>
  );
}
