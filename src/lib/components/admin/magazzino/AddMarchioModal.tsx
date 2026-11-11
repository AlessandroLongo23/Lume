'use client';

import { useState, useEffect } from 'react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';
import type { Manufacturer } from '@/lib/types/Manufacturer';

interface AddMarchioModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedManufacturer: Manufacturer | null;
}

const emptyForm = () => ({ name: '' });

export function AddMarchioModal({ isOpen, onClose, selectedManufacturer }: AddMarchioModalProps) {
  const addManufacturer = useManufacturersStore((s) => s.addManufacturer);
  const updateManufacturer = useManufacturersStore((s) => s.updateManufacturer);
  const [form, setForm] = useState(emptyForm());
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (selectedManufacturer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: selectedManufacturer.name });
    } else {
      setForm(emptyForm());
    }
    setNameError('');
  }, [selectedManufacturer, isOpen]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setNameError('Il nome è obbligatorio.'); return; }
    setNameError('');
    try {
      if (selectedManufacturer) {
        await updateManufacturer(selectedManufacturer.id, { name: form.name.trim() });
        messagePopup.getState().success('Marchio aggiornato.');
      } else {
        await addManufacturer({ name: form.name.trim() });
        messagePopup.getState().success('Marchio aggiunto.');
        // Advances an interactive guide's "save" step on a successful create.
        emitTourEvent('manufacturer:created');
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
      title={selectedManufacturer ? 'Modifica Marchio' : 'Nuovo Marchio'}
      subtitle="Marchio o produttore dei prodotti del magazzino"
      confirmText={selectedManufacturer ? 'Aggiorna' : 'Aggiungi'}
      classes="max-w-sm"
      confirmDataTour="save-manufacturer"
      onEnterComplete={() => emitTourEvent('manufacturer:modal-open')}
    >
      <div className="flex flex-col gap-4">
        <FormInput
          label="Nome"
          required
          data-tour="field-manufacturer-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="es. L'Oréal, Wella, Schwarzkopf..."
          error={nameError || undefined}
        />
      </div>
    </AddModal>
  );
}
