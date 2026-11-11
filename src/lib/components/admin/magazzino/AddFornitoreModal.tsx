'use client';

import { useState, useEffect } from 'react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';
import type { Supplier } from '@/lib/types/Supplier';

interface AddFornitoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupplier: Supplier | null;
}

const emptyForm = () => ({ name: '', city: '', phone: '', email: '' });

export function AddFornitoreModal({ isOpen, onClose, selectedSupplier }: AddFornitoreModalProps) {
  const addSupplier = useSuppliersStore((s) => s.addSupplier);
  const updateSupplier = useSuppliersStore((s) => s.updateSupplier);
  const [form, setForm] = useState(emptyForm());
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (selectedSupplier) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        name: selectedSupplier.name,
        city: selectedSupplier.city ?? '',
        phone: selectedSupplier.phone ?? '',
        email: selectedSupplier.email ?? '',
      });
    } else {
      setForm(emptyForm());
    }
    setNameError('');
  }, [selectedSupplier, isOpen]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setNameError('Il nome è obbligatorio.'); return; }
    setNameError('');
    const payload = {
      name: form.name.trim(),
      city: form.city.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, payload);
        messagePopup.getState().success('Fornitore aggiornato.');
      } else {
        await addSupplier(payload);
        messagePopup.getState().success('Fornitore aggiunto.');
        // Advances an interactive guide's "save" step on a successful create.
        emitTourEvent('supplier:created');
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };


  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={selectedSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
      subtitle="Aggiungi o modifica un fornitore"
      confirmText={selectedSupplier ? 'Aggiorna' : 'Aggiungi'}
      classes="max-w-md"
      confirmDataTour="save-supplier"
      onEnterComplete={() => emitTourEvent('supplier:modal-open')}
    >
      <div className="flex flex-col gap-4" data-tour="supplier-form">
        <FormInput
          label="Nome"
          required
          data-tour="field-supplier-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="es. Distribuzione Sud Srl"
          error={nameError || undefined}
        />
        <FormInput
          label="Città"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          placeholder="es. Napoli"
        />
        <FormInput
          label="Telefono"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="es. 081 123 4567"
        />
        <FormInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="es. ordini@fornitore.it"
        />
      </div>
    </AddModal>
  );
}
