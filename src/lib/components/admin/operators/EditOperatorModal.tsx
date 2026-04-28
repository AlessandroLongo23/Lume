'use client';

import { useState, useEffect } from 'react';
import { User, AtSign, Phone, Archive, ArchiveRestore, Info } from 'lucide-react';
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

const emptyErrors = () => ({ firstName: '', lastName: '', email: '', phone: '' });

export function EditOperatorModal({ isOpen, onClose, editedOperator, onEditedOperatorChange, selectedOperator }: EditOperatorModalProps) {
  const updateOperator = useOperatorsStore((s) => s.updateOperator);
  const archiveOperator = useOperatorsStore((s) => s.archiveOperator);
  const restoreOperator = useOperatorsStore((s) => s.restoreOperator);
  const [errors, setErrors] = useState(emptyErrors());

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrors(emptyErrors());
    }
  }, [isOpen]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedOperatorChange({ ...editedOperator, [key]: value });

  const handleSubmit = async () => {
    if (!selectedOperator) return;

    const e = emptyErrors();
    if (!editedOperator.firstName) e.firstName = 'Inserisci un nome';
    if (!editedOperator.lastName) e.lastName = 'Inserisci un cognome';
    if (!editedOperator.email) e.email = 'Inserisci un email';
    if (!editedOperator.phonePrefix || !editedOperator.phoneNumber) e.phone = 'Inserisci un numero di telefono';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { password: _pw, ...toUpdate } = editedOperator as any;
      await updateOperator(selectedOperator.id, { ...selectedOperator, ...toUpdate });
      messagePopup.getState().success('Operatore aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const handleToggleArchive = async () => {
    if (!selectedOperator) return;
    try {
      if (selectedOperator.isArchived) {
        await restoreOperator(selectedOperator.id);
        messagePopup.getState().success('Operatore ripristinato.');
      } else {
        await archiveOperator(selectedOperator.id);
        messagePopup.getState().success('Operatore archiviato.');
      }
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'operazione.");
    }
  };

  const isArchived = selectedOperator?.isArchived ?? false;
  // When the operator is linked to a Lume account, identity fields are owned
  // by that user's Profilo and synced server-side via /api/preferences. Keep
  // them read-only here so the salon owner can't shadow-edit someone's profile.
  const linkedToUser = !!selectedOperator?.user_id;

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const lockedInputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 cursor-not-allowed';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Modifica Operatore"
      subtitle="Aggiorna i dati dell'operatore"
      classes="max-w-2xl"
      footerContent={
        <button
          type="button"
          className="flex flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
          onClick={handleToggleArchive}
        >
          {isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
          {isArchived ? 'Ripristina' : 'Archivia'}
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {linkedToUser && (
          <div className="flex items-start gap-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-600 dark:text-zinc-400">
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <span>
              Nome, email, telefono e immagine sono modificati da questo operatore dal proprio profilo.
            </span>
          </div>
        )}

        <div className="flex flex-row items-start gap-6 w-full">
          <div className="flex grow flex-col gap-2">
            <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
            <input
              type="text"
              className={linkedToUser ? lockedInputClass : inputClass}
              value={editedOperator.firstName ?? ''}
              onChange={(e) => set('firstName', e.target.value)}
              disabled={linkedToUser}
            />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
          </div>
          <div className="flex grow flex-col gap-2">
            <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cognome *</span></label>
            <input
              type="text"
              className={linkedToUser ? lockedInputClass : inputClass}
              value={editedOperator.lastName ?? ''}
              onChange={(e) => set('lastName', e.target.value)}
              disabled={linkedToUser}
            />
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        <div className="flex flex-row items-center gap-6 w-full">
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email *</span></label>
            <input
              type="email"
              className={linkedToUser ? lockedInputClass : inputClass}
              value={editedOperator.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
              autoComplete="off"
              disabled={linkedToUser}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <label className={labelClass}><Phone className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Telefono</span></label>
            <PhoneNumber
              prefixCode={editedOperator.phonePrefix ?? '+39'}
              phoneNumber={editedOperator.phoneNumber ?? ''}
              onPrefixChange={(v) => set('phonePrefix', v)}
              onPhoneChange={(v) => set('phoneNumber', v)}
              disabled={linkedToUser}
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
        </div>
      </div>
    </EditModal>
  );
}
