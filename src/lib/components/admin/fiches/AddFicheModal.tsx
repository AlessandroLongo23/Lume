'use client';

import { useState } from 'react';
import { User, Calendar, FileText, Check } from 'lucide-react';
import { useFichesStore } from '@/lib/stores/fiches';
import { useClientsStore } from '@/lib/stores/clients';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';

interface AddFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyFiche = () => ({ client_id: '', datetime: '', status: FicheStatus.PENDING, note: '' });

export function AddFicheModal({ isOpen, onClose }: AddFicheModalProps) {
  const addFiche = useFichesStore((s) => s.addFiche);
  const clients = useClientsStore((s) => s.clients);
  const [fiche, setFiche] = useState(emptyFiche());
  const [errors, setErrors] = useState({ client_id: '', datetime: '' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setFiche((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    const e = { client_id: '', datetime: '' };
    if (!fiche.client_id) e.client_id = 'Seleziona un cliente';
    if (!fiche.datetime) e.datetime = 'Inserisci data e ora';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addFiche({ ...fiche, datetime: new Date(fiche.datetime) as any });
      messagePopup.getState().success('Fiche aggiunta con successo');
      setFiche(emptyFiche());
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione della fiche: ' + msg);
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';
  const clientOptions = clients.map((c) => ({ ...c, fullName: `${c.firstName} ${c.lastName}` }));

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuova fiche" subtitle="Aggiungi una nuova fiche" classes="max-w-lg">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cliente *</span></label>
          <CustomSelect options={clientOptions} labelKey="fullName" valueKey="id" value={fiche.client_id} onChange={(v) => set('client_id', v)} placeholder="Seleziona cliente" />
          {errors.client_id && <p className="text-xs text-red-500">{errors.client_id}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data e ora *</span></label>
          <input type="datetime-local" className={inputClass} value={fiche.datetime} onChange={(e) => set('datetime', e.target.value)} />
          {errors.datetime && <p className="text-xs text-red-500">{errors.datetime}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><Check className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Stato</span></label>
          <select className={inputClass} value={fiche.status} onChange={(e) => set('status', e.target.value)}>
            <option value={FicheStatus.CREATED}>Creata</option>
            <option value={FicheStatus.PENDING}>In attesa</option>
            <option value={FicheStatus.COMPLETED}>Completata</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}><FileText className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nota</span></label>
          <textarea className={inputClass} rows={3} value={fiche.note} onChange={(e) => set('note', e.target.value)} placeholder="Note aggiuntive..." />
        </div>
      </div>
    </AddModal>
  );
}
