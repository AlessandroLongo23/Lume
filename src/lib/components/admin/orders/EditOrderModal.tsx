'use client';

import { Calendar, Check } from 'lucide-react';
import { useOrdersStore } from '@/lib/stores/orders';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedOrderChange({ ...editedOrder, [key]: value });

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

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';
  const datetimeValue = editedOrder.datetime
    ? new Date(editedOrder.datetime).toISOString().slice(0, 16)
    : '';

  return (
    <EditModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica ordine" subtitle="Gestione ordini" classes="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data e ora</span></label>
          <input type="datetime-local" className={inputClass} value={datetimeValue} onChange={(e) => set('datetime', new Date(e.target.value))} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Check className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Stato</span></label>
          <CustomSelect
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value={(editedOrder as any).status ?? null}
            onChange={(v) => set('status', v)}
            options={ORDER_STATUS_OPTIONS}
            labelKey="label"
            valueKey="value"
            searchable={false}
          />
        </div>
      </div>
    </EditModal>
  );
}
