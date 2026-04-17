'use client';

import { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { ClientForm, validateBirthDate, type ClientFormValue, type ClientFormErrors } from './ClientForm';
import { Gender } from '@/lib/types/Gender';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyClient = (): ClientFormValue => ({
  firstName: '',
  lastName: '',
  gender: Gender.MALE,
  email: '',
  password: '',
  phonePrefix: '+39',
  phoneNumber: '',
  isTourist: false,
  birthDate: '',
  note: '',
});

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const clients = useClientsStore((s) => s.clients);
  const addClient = useClientsStore((s) => s.addClient);

  const [client, setClient] = useState<ClientFormValue>(emptyClient());
  const [errors, setErrors] = useState<ClientFormErrors>({});

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClient({ ...emptyClient(), password: String(clients.length + 1).padStart(6, '0') });
      setErrors({});
    }
  }, [isOpen, clients.length]);

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
