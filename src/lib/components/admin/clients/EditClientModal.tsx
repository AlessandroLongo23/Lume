'use client';

import { useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { User, VenusAndMars, AtSign, Phone, Lock, Calendar, Plane, Eye, EyeOff } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import { CustomCheckbox } from '@/lib/components/shared/ui/forms/CustomCheckbox';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Gender } from '@/lib/types/Gender';
import type { Client } from '@/lib/types/Client';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  editedClient: Partial<Client>;
  onEditedClientChange: (c: Partial<Client>) => void;
  selectedClient: Client | null;
}

const validateBirthDate = (date: string): string => {
  if (!date || !date.trim()) return '';
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
  if (!dateRegex.test(date)) return 'Formato data non valido. Usa GG/MM/AAAA';
  const [d, m, y] = date.split('/').map(Number);
  const obj = new Date(y, m - 1, d);
  if (obj.getDate() !== d || obj.getMonth() !== m - 1 || obj.getFullYear() !== y) return 'Data non valida';
  if (obj > new Date()) return 'La data di nascita non può essere nel futuro';
  return '';
};

export function EditClientModal({ isOpen, onClose, editedClient, onEditedClientChange, selectedClient }: EditClientModalProps) {
  const updateClient = useClientsStore((s) => s.updateClient);
  const [dateError, setDateError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => onEditedClientChange({ ...editedClient, [key]: value });

  const handleSubmit = async () => {
    if (!selectedClient) return;

    if (editedClient.birthDate) {
      const err = validateBirthDate(editedClient.birthDate);
      setDateError(err);
      if (err) { messagePopup.getState().error('La data di nascita non è valida'); return; }
    }

    let formattedBirthDate: string | null = null;
    if (editedClient.birthDate) {
      const parsed = parse(editedClient.birthDate, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) formattedBirthDate = format(parsed, 'yyyy-MM-dd');
    }

    try {
      await updateClient(selectedClient.id, { ...selectedClient, ...editedClient, birthDate: formattedBirthDate ?? undefined });
      messagePopup.getState().success('Cliente aggiornato con successo!');
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <EditModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Modifica Cliente" subtitle="Aggiorna i dati dello cliente" classes="max-w-2xl">
      <div className="flex flex-col gap-4">
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-row items-center gap-6 w-full">
              <div className="flex flex-grow flex-col gap-2">
                <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
                <input type="text" className={inputClass} value={editedClient.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div className="flex flex-grow flex-col gap-2">
                <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cognome *</span></label>
                <input type="text" className={inputClass} value={editedClient.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} />
              </div>
              <div className="flex flex-grow flex-col gap-2">
                <label className={labelClass}><VenusAndMars className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Genere</span></label>
                <ToggleButton
                  options={[Gender.MALE, Gender.FEMALE]}
                  value={editedClient.gender ?? Gender.MALE}
                  onChange={(v) => set('gender', v)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-row items-center gap-6 w-full">
              <div className="flex flex-1 flex-col gap-2">
                <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email *</span></label>
                <input type="email" className={inputClass} value={editedClient.email ?? ''} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <label className={labelClass}><Phone className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Telefono</span></label>
                <PhoneNumber
                  prefixCode={editedClient.phonePrefix ?? '+39'}
                  phoneNumber={editedClient.phoneNumber ?? ''}
                  onPrefixChange={(v) => set('phonePrefix', v)}
                  onPhoneChange={(v) => set('phoneNumber', v)}
                />
              </div>
            </div>

            <div className="flex flex-row items-start gap-6 w-full">
              <div className="flex flex-1 flex-col gap-2">
                <label className={labelClass}><Lock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Password App *</span></label>
                <div className="relative">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <input type={showPassword ? 'text' : 'password'} className={inputClass} value={(editedClient as any).password ?? ''} onChange={(e) => set('password', e.target.value)} autoComplete="off" />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data di nascita</span></label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="GG/MM/AAAA"
                  value={editedClient.birthDate ?? ''}
                  onChange={(e) => { set('birthDate', e.target.value); setDateError(''); }}
                />
                {dateError && <p className="text-xs text-red-500">{dateError}</p>}
              </div>

              <div className="flex flex-col items-center justify-center gap-2">
                <label className={labelClass}><Plane className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Turista</span></label>
                <CustomCheckbox checked={editedClient.isTourist ?? false} onChange={(v) => set('isTourist', v)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </EditModal>
  );
}
