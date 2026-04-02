'use client';

import { useState } from 'react';
import { ALargeSmall, Tag, Clock, Euro, FileText, ShoppingCart } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyService = () => ({ name: '', category_id: '', price: 0, product_cost: 0, duration: 30, description: '' });
const emptyErrors = () => ({ name: '', category_id: '', price: '' });

export function AddServiceModal({ isOpen, onClose }: AddServiceModalProps) {
  const addService = useServicesStore((s) => s.addService);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const [service, setService] = useState(emptyService());
  const [errors, setErrors] = useState(emptyErrors());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setService((s) => ({ ...s, [key]: value }));

  const handleSubmit = async () => {
    const e = emptyErrors();
    if (!service.name) e.name = 'Inserisci un nome';
    if (!service.category_id) e.category_id = 'Seleziona una categoria';
    if (service.price < 0) e.price = 'Inserisci un prezzo valido';
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

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuovo servizio" subtitle="Aggiungi un nuovo servizio" classes="max-w-3xl">
      <div className="flex flex-col gap-4">
        {/* Row 1: Name + Category */}
        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><ALargeSmall className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
            <input type="text" className={inputClass} value={service.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Tag className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Categoria *</span></label>
            <CustomSelect options={categories} labelKey="name" valueKey="id" value={service.category_id} onChange={(v) => set('category_id', v)} placeholder="Seleziona categoria" />
            {errors.category_id && <p className="text-xs text-red-500">{errors.category_id}</p>}
          </div>
        </div>

        {/* Row 2: Duration + Price + Product cost */}
        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Clock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Durata (min)</span></label>
            <CustomNumberInput value={service.duration} onChange={(v) => set('duration', v ?? 30)} min={1} step={5} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Euro className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Prezzo</span></label>
            <CustomNumberInput value={service.price} onChange={(v) => set('price', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><ShoppingCart className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Costo prodotti</span></label>
            <CustomNumberInput value={service.product_cost} onChange={(v) => set('product_cost', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
          </div>
        </div>

        {/* Row 3: Description */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}><FileText className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Descrizione</span></label>
          <textarea className={inputClass} rows={3} value={service.description} onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
    </AddModal>
  );
}
