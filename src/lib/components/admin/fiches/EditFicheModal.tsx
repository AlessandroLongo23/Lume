'use client';

import { Calendar, FileText, Check } from 'lucide-react';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useFichesStore } from '@/lib/stores/fiches';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import type { Fiche } from '@/lib/types/Fiche';

interface EditFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedFiche: Partial<Fiche>;
  onEditedFicheChange: (f: Partial<Fiche>) => void;
  selectedFiche: Fiche | null;
}

export function EditFicheModal({ isOpen, onClose, editedFiche, onEditedFicheChange, selectedFiche }: EditFicheModalProps) {
  const updateFiche = useFichesStore((s) => s.updateFiche);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedFicheChange({ ...editedFiche, [key]: value });

  const handleSubmit = async () => {
    if (!selectedFiche) return;
    try {
      await updateFiche(selectedFiche.id, { ...selectedFiche, ...editedFiche });
      messagePopup.getState().success('Fiche aggiornata con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';
  const datetimeValue = editedFiche.datetime
    ? new Date(editedFiche.datetime).toISOString().slice(0, 16)
    : '';

  return (
    <EditModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica Fiche" subtitle="Aggiorna i dati della fiche" classes="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data e ora</span></label>
          <input type="datetime-local" className={inputClass} value={datetimeValue} onChange={(e) => set('datetime', new Date(e.target.value))} />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Check className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Stato</span></label>
          <select className={inputClass} value={editedFiche.status ?? ''} onChange={(e) => set('status', e.target.value)}>
            <option value={FicheStatus.CREATED}>Creata</option>
            <option value={FicheStatus.PENDING}>In attesa</option>
            <option value={FicheStatus.COMPLETED}>Completata</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><FileText className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nota</span></label>
          <textarea className={inputClass} rows={3} value={editedFiche.note ?? ''} onChange={(e) => set('note', e.target.value)} />
        </div>
      </div>
    </EditModal>
  );
}
