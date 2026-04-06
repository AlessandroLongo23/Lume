'use client';

import { useState, useEffect } from 'react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useManufacturersStore } from '@/lib/stores/manufacturers';
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(emptyForm());
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error(msg);
    }
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={selectedManufacturer ? 'Modifica Marchio' : 'Nuovo Marchio'}
      subtitle="Marchio o produttore dei prodotti del magazzino"
      confirmText={selectedManufacturer ? 'Aggiorna' : 'Aggiungi'}
      classes="max-w-sm"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="es. L'Oréal, Wella, Schwarzkopf..."
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>
      </div>
    </AddModal>
  );
}
