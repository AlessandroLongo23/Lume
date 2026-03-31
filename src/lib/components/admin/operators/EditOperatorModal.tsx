'use client';

import { User, AtSign, Phone } from 'lucide-react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import type { Operator } from '@/lib/types/Operator';

interface EditOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedOperator: Partial<Operator>;
  onEditedOperatorChange: (o: Partial<Operator>) => void;
  selectedOperator: Operator | null;
}

export function EditOperatorModal({ isOpen, onClose, editedOperator, onEditedOperatorChange, selectedOperator }: EditOperatorModalProps) {
  const updateOperator = useOperatorsStore((s) => s.updateOperator);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedOperatorChange({ ...editedOperator, [key]: value });

  const handleSubmit = async () => {
    if (!selectedOperator) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      const { password: _pw, ...toUpdate } = editedOperator as any;
      await updateOperator(selectedOperator.id, { ...selectedOperator, ...toUpdate });
      messagePopup.getState().success('Operatore aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <EditModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica Operatore" subtitle="Aggiorna i dati dell'operatore" classes="max-w-2xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-row items-center gap-6 w-full">
          <div className="flex grow flex-col gap-2">
            <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
            <input type="text" className={inputClass} value={editedOperator.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} />
          </div>
          <div className="flex grow flex-col gap-2">
            <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cognome *</span></label>
            <input type="text" className={inputClass} value={editedOperator.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} />
          </div>
        </div>

        <div className="flex flex-row items-center gap-6 w-full">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email *</span></label>
            <input type="email" className={inputClass} value={editedOperator.email ?? ''} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Phone className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Telefono</span></label>
            <PhoneNumber
              prefixCode={editedOperator.phonePrefix ?? '+39'}
              phoneNumber={editedOperator.phoneNumber ?? ''}
              onPrefixChange={(v) => set('phonePrefix', v)}
              onPhoneChange={(v) => set('phoneNumber', v)}
            />
          </div>
        </div>
      </div>
    </EditModal>
  );
}
