'use client';

import { useState, useEffect } from 'react';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { useSuppliersStore } from '@/lib/stores/suppliers';
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
      title={selectedSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
      subtitle="Aggiungi o modifica un fornitore"
      confirmText={selectedSupplier ? 'Aggiorna' : 'Aggiungi'}
      classes="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
            placeholder="es. Distribuzione Sud Srl"
          />
          {nameError && <p className="text-xs text-red-500">{nameError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Città</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className={inputClass}
            placeholder="es. Napoli"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefono</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass}
            placeholder="es. 081 123 4567"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
            placeholder="es. ordini@fornitore.it"
          />
        </div>
      </div>
    </AddModal>
  );
}
