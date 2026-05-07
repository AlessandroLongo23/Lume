'use client';

import { useState } from 'react';
import { Calendar, Check, Truck } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyOrder = () => ({ supplier_id: '', datetime: '', status: 'pending' });

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  const addOrder = useOrdersStore((s) => s.addOrder);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const [order, setOrder] = useState(emptyOrder());
  const [errors, setErrors] = useState({ supplier_id: '', datetime: '' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setOrder((o) => ({ ...o, [key]: value }));

  const handleSubmit = async () => {
    const e = { supplier_id: '', datetime: '' };
    if (!order.supplier_id) e.supplier_id = 'Seleziona un fornitore';
    if (!order.datetime) e.datetime = 'Inserisci data e ora';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addOrder({ ...order, datetime: new Date(order.datetime) as any });
      messagePopup.getState().success('Ordine aggiunto con successo');
      setOrder(emptyOrder());
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error("Errore durante la creazione dell'ordine: " + msg);
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Aggiungi ordine" subtitle="Gestione ordini" classes="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}><Truck className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Fornitore *</span></label>
          <CustomSelect options={suppliers} labelKey="name" valueKey="id" value={order.supplier_id} onChange={(v) => set('supplier_id', v)} placeholder="Seleziona fornitore" />
          {errors.supplier_id && <p className="text-xs text-red-500">{errors.supplier_id}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data e ora *</span></label>
          <input type="datetime-local" className={inputClass} value={order.datetime} onChange={(e) => set('datetime', e.target.value)} />
          {errors.datetime && <p className="text-xs text-red-500">{errors.datetime}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Check className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Stato</span></label>
          <CustomSelect
            value={order.status}
            onChange={(v) => set('status', v)}
            options={[
              { value: 'pending', label: 'In attesa' },
              { value: 'confirmed', label: 'Confermato' },
              { value: 'delivered', label: 'Consegnato' },
              { value: 'cancelled', label: 'Annullato' },
            ]}
            labelKey="label"
            valueKey="value"
            searchable={false}
          />
        </div>
      </div>
    </AddModal>
  );
}
