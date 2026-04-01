'use client';

import { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { User, Mars, Venus, VenusAndMars, AtSign, Phone, Lock, Calendar, Plane, Eye, EyeOff, Tag } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { useClientCategoriesStore } from '@/lib/stores/client_categories';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomCheckbox } from '@/lib/components/shared/ui/forms/CustomCheckbox';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Gender } from '@/lib/types/Gender';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptyClient = () => ({
  firstName: '',
  lastName: '',
  gender: Gender.MALE,
  email: '',
  password: '',
  phonePrefix: '+39',
  phoneNumber: '',
  isTourist: false,
  categoryId: '',
  birthDate: '',
  note: '',
});

const emptyErrors = () => ({
  firstName: '',
  lastName: '',
  gender: '',
  email: '',
  phoneNumber: '',
  password: '',
  categoryId: '',
  birthDate: '',
});

const validateBirthDate = (date: string): string => {
  if (!date.trim()) return '';
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
  if (!dateRegex.test(date)) return 'Formato data non valido. Usa GG/MM/AAAA';
  const [d, m, y] = date.split('/').map(Number);
  const obj = new Date(y, m - 1, d);
  if (obj.getDate() !== d || obj.getMonth() !== m - 1 || obj.getFullYear() !== y) return 'Data non valida';
  if (obj > new Date()) return 'La data di nascita non può essere nel futuro';
  return '';
};

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  const clients = useClientsStore((s) => s.clients);
  const addClient = useClientsStore((s) => s.addClient);
  const clientCategories = useClientCategoriesStore((s) => s.client_categories);

  const [client, setClient] = useState(emptyClient());
  const [errors, setErrors] = useState(emptyErrors());
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClient({ ...emptyClient(), password: String(clients.length + 1).padStart(6, '0') });
      setErrors(emptyErrors());
    }
  }, [isOpen, clients.length]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (key: string, value: any) => setClient((c) => ({ ...c, [key]: value }));

  const handleSubmit = async () => {
    const newErrors = emptyErrors();
    if (!client.firstName) newErrors.firstName = 'Inserisci un nome';
    if (!client.lastName) newErrors.lastName = 'Inserisci un cognome';
    if (!client.email) newErrors.email = 'Inserisci un email';
    if (!client.password) newErrors.password = 'Inserisci una password';
    if (!client.gender) newErrors.gender = 'Seleziona un genere';
    if (client.birthDate) newErrors.birthDate = validateBirthDate(client.birthDate);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    let formattedBirthDate: string | null = null;
    if (client.birthDate) {
      const parsed = parse(client.birthDate, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) formattedBirthDate = format(parsed, 'yyyy-MM-dd');
    }

    try {
      await addClient({ ...client, birthDate: formattedBirthDate ?? undefined });
      messagePopup.getState().success('Cliente aggiunto con successo');
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Errore sconosciuto';
      messagePopup.getState().error('Errore durante la creazione del cliente: ' + msg);
    }
  };

  const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-shadow';
  const labelClass = 'flex flex-row items-center gap-2';

  return (
    <AddModal isOpen={isOpen} onClose={onClose} onSubmit={handleSubmit} title="Nuovo cliente" subtitle="Aggiungi un nuovo cliente" classes="max-w-3xl">
      <div className="flex flex-col gap-8">
        {/* Section 1: Informazioni personali */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Informazioni personali</h3>

          <div className="flex flex-row items-start gap-4 w-full">
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
              <input type="text" className={inputClass} value={client.firstName} onChange={(e) => set('firstName', e.target.value)} />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cognome *</span></label>
              <input type="text" className={inputClass} value={client.lastName} onChange={(e) => set('lastName', e.target.value)} />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <label className={labelClass}><VenusAndMars className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Genere</span></label>
              <ToggleButton
                options={[Gender.MALE, Gender.FEMALE]}
                value={client.gender}
                onChange={(v) => set('gender', v)}
                icons={[Mars, Venus]}
                className="h-10"
              />
              {errors.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <label className={labelClass}><Plane className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Turista</span></label>
              <CustomCheckbox checked={client.isTourist} onChange={(v) => set('isTourist', v)} />
            </div>
          </div>

          <div className="flex flex-row items-start gap-4 w-full">
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><Phone className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Telefono</span></label>
              <PhoneNumber prefixCode={client.phonePrefix} phoneNumber={client.phoneNumber} onPrefixChange={(v) => set('phonePrefix', v)} onPhoneChange={(v) => set('phoneNumber', v)} />
              {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><Tag className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Categoria</span></label>
              <CustomSelect
                options={clientCategories}
                labelKey="name"
                valueKey="id"
                value={client.categoryId}
                onChange={(v) => set('categoryId', v)}
                placeholder="Seleziona categoria"
              />
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId}</p>}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data di nascita</span></label>
              <input type="text" className={inputClass} placeholder="GG/MM/AAAA" value={client.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
              {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-zinc-500/25" />

        {/* Section 2: Account */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Account</h3>

          <div className="flex flex-row items-start gap-4 w-full">
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email *</span></label>
              <input type="email" className={inputClass} value={client.email} onChange={(e) => set('email', e.target.value)} />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <label className={labelClass}><Lock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Password App *</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={inputClass} value={client.password} onChange={(e) => set('password', e.target.value)} />
                <button type="button" aria-label={showPassword ? 'Nascondi password' : 'Mostra password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>
        </div>
      </div>
    </AddModal>
  );
}
