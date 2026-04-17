'use client';

import { useState } from 'react';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { ServiceForm, type ServiceFormValue, type ServiceFormErrors } from './ServiceForm';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyService = (): ServiceFormValue => ({
  name: '',
  category_id: '',
  price: 0,
  product_cost: 0,
  duration: 30,
  description: '',
});

export function AddServiceModal({ isOpen, onClose }: AddServiceModalProps) {
  const addService = useServicesStore((s) => s.addService);
  const [service, setService] = useState<ServiceFormValue>(emptyService());
  const [errors, setErrors] = useState<ServiceFormErrors>({});

  const handleSubmit = async () => {
    const e: ServiceFormErrors = {};
    if (!service.name?.trim()) e.name = 'Inserisci un nome';
    if (!service.category_id) e.category_id = 'Seleziona una categoria';
    if ((service.price ?? 0) < 0) e.price = 'Inserisci un prezzo valido';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      await addService(service);
      messagePopup.getState().success('Servizio aggiunto con successo');
      setService(emptyService());
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione del servizio: ' + msg);
    }
  };

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuovo servizio" subtitle="Aggiungi un nuovo servizio" classes="max-w-2xl">
      <ServiceForm value={service} onChange={setService} errors={errors} />
    </AddModal>
  );
}
