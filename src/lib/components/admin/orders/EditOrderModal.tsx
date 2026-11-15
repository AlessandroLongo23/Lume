'use client';

import { format } from 'date-fns';
import { Calendar, Check } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateTimeField } from '@/lib/components/shared/ui/forms/DateTimeField';
import type { Order } from '@/lib/types/Order';

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'In attesa' },
  { value: 'confirmed', label: 'Confermato' },
  { value: 'delivered', label: 'Consegnato' },
  { value: 'cancelled', label: 'Annullato' },
];

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedOrder: Partial<Order>;
  onEditedOrderChange: (o: Partial<Order>) => void;
  selectedOrder: Order | null;
}

export function EditOrderModal({ isOpen, onClose, editedOrder, onEditedOrderChange, selectedOrder }: EditOrderModalProps) {
  const updateOrder = useOrdersStore((s) => s.updateOrder);
  const set = <K extends keyof Order>(key: K, value: Order[K]) =>
    onEditedOrderChange({ ...editedOrder, [key]: value });

  const handleSubmit = async () => {
    if (!selectedOrder) return;
    try {
      await updateOrder(selectedOrder.id, { ...selectedOrder, ...editedOrder });
      messagePopup.getState().success('Ordine aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento dell'ordine.");
    }
  };

  // Local wall-clock time: the field edits local time and saves it back as UTC.
  const datetimeValue = editedOrder.datetime
    ? format(new Date(editedOrder.datetime), "yyyy-MM-dd'T'HH:mm")
    : '';

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica ordine" subtitle="Gestione ordini" confirmText="Salva" classes="max-w-lg">
      <div className="flex flex-col gap-4">
        <Field label="Data e ora" labelIcon={Calendar}>
          {({ id }) => (
            <DateTimeField
              id={id}
              value={datetimeValue}
              onChange={(v) => set('datetime', v ? new Date(v).toISOString() : null)}
            />
          )}
        </Field>

        <Field label="Stato" labelIcon={Check}>
          {({ id }) => (
            <Select
              id={id}
              value={editedOrder.status ?? null}
              onChange={(v) => set('status', v)}
              options={ORDER_STATUS_OPTIONS}
              labelKey="label"
              valueKey="value"
              searchable={false}
            />
          )}
        </Field>
      </div>
    </AddModal>
  );
}
