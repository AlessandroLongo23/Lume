'use client';

import { useState } from 'react';
import { Calendar, Check, Truck } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { useSuppliersStore } from '@/lib/stores/suppliers';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateTimeField } from '@/lib/components/shared/ui/forms/DateTimeField';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyOrder = () => ({ supplier_id: '', datetime: '', status: 'pending' });
type OrderDraft = ReturnType<typeof emptyOrder>;

export function AddOrderModal({ isOpen, onClose }: AddOrderModalProps) {
  const addOrder = useOrdersStore((s) => s.addOrder);
  const suppliers = useSuppliersStore((s) => s.suppliers);
  const [order, setOrder] = useState(emptyOrder());
  const [errors, setErrors] = useState({ supplier_id: '', datetime: '' });

  const set = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) =>
    setOrder((o) => ({ ...o, [key]: value }));

  const handleSubmit = async () => {
    const e = { supplier_id: '', datetime: '' };
    if (!order.supplier_id) e.supplier_id = 'Seleziona un fornitore';
    if (!order.datetime) e.datetime = 'Inserisci data e ora';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      await addOrder({ ...order, datetime: new Date(order.datetime).toISOString() });
      emitTourEvent('order:created');
      messagePopup.getState().success('Ordine aggiunto con successo');
      setOrder(emptyOrder());
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error("Errore durante la creazione dell'ordine: " + msg);
    }
  };


  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Aggiungi ordine" subtitle="Gestione ordini" classes="max-w-lg" confirmDataTour="save-order" onEnterComplete={() => emitTourEvent('order:modal-open')}>
      <div data-tour="order-form" className="flex flex-col gap-4">
        <Field label="Fornitore" labelIcon={Truck} required error={errors.supplier_id || undefined}>
          {({ id }) => (
            <Select id={id} options={suppliers} labelKey="name" valueKey="id" value={order.supplier_id} onChange={(v) => { set('supplier_id', v); emitTourEvent('order:supplier-selected'); }} placeholder="Seleziona fornitore" />
          )}
        </Field>

        <Field label="Data e ora" labelIcon={Calendar} required error={errors.datetime || undefined}>
          {({ id }) => (
            <div data-tour="field-order-datetime">
              <DateTimeField id={id} value={order.datetime} onChange={(v) => set('datetime', v)} />
            </div>
          )}
        </Field>

        <div data-tour="field-order-status">
          <Field label="Stato" labelIcon={Check}>
            {({ id }) => (
              <Select
                id={id}
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
            )}
          </Field>
        </div>
      </div>
    </AddModal>
  );
}
