'use client';

import { ALargeSmall, Tag, Clock, Euro, FileText, ShoppingCart } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import type { Service } from '@/lib/types/Service';

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedService: Partial<Service>;
  onEditedServiceChange: (s: Partial<Service>) => void;
  selectedService: Service | null;
}

export function EditServiceModal({ isOpen, onClose, editedService, onEditedServiceChange, selectedService }: EditServiceModalProps) {
  const updateService = useServicesStore((s) => s.updateService);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedServiceChange({ ...editedService, [key]: value });

  const handleSubmit = async () => {
    if (!selectedService) return;
    try {
      await updateService(selectedService.id, { ...selectedService, ...editedService });
      messagePopup.getState().success('Servizio aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <EditModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica Servizio" subtitle="Aggiorna i dati del servizio" classes="max-w-3xl">
      <div className="flex flex-col gap-4">
        {/* Row 1: Name + Category */}
        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><ALargeSmall className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome</span></label>
            <input type="text" className={inputClass} value={editedService.name ?? ''} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Tag className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Categoria</span></label>
            <CustomSelect options={categories} labelKey="name" valueKey="id" value={editedService.category_id ?? ''} onChange={(v) => set('category_id', v)} placeholder="Seleziona categoria" />
          </div>
        </div>

        {/* Row 2: Duration + Price + Product cost */}
        <div className="flex flex-row gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Clock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Durata (min)</span></label>
            <CustomNumberInput value={editedService.duration ?? 30} onChange={(v) => set('duration', v ?? 30)} min={1} step={5} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Euro className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Prezzo</span></label>
            <CustomNumberInput value={editedService.price ?? 0} onChange={(v) => set('price', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><ShoppingCart className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Costo prodotti</span></label>
            <CustomNumberInput value={editedService.product_cost ?? 0} onChange={(v) => set('product_cost', v ?? 0)} min={0} step={0.01} suffix="€" decimals={2} />
          </div>
        </div>

        {/* Row 3: Description */}
        <div className="flex flex-col gap-2">
          <label className={labelClass}><FileText className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Descrizione</span></label>
          <textarea className={inputClass} rows={3} value={editedService.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
    </EditModal>
  );
}
