'use client';

import { useState } from 'react';
import { User, VenusAndMars, AtSign, Phone, Lock, Calendar, Plane, Eye, EyeOff, FileHeart } from 'lucide-react';
import { CustomCheckbox } from '@/lib/components/shared/ui/forms/CustomCheckbox';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Gender } from '@/lib/types/Gender';
import type { Client } from '@/lib/types/Client';

export type ClientFormValue = Partial<Client> & { password?: string };

export type ClientFormErrors = Partial<Record<
  'firstName' | 'lastName' | 'gender' | 'email' | 'phoneNumber' | 'password' | 'birthDate',
  string
>>;

interface ClientFormProps {
  value: ClientFormValue;
  onChange: (value: ClientFormValue) => void;
  errors?: ClientFormErrors;
  lockEmail?: boolean;
  lockPhone?: boolean;
  showPassword?: boolean;
  showNote?: boolean;
}

export const validateBirthDate = (date: string): string => {
  if (!date || !date.trim()) return '';
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
  if (!dateRegex.test(date)) return 'Formato data non valido. Usa GG/MM/AAAA';
  const [d, m, y] = date.split('/').map(Number);
  const obj = new Date(y, m - 1, d);
  if (obj.getDate() !== d || obj.getMonth() !== m - 1 || obj.getFullYear() !== y) return 'Data non valida';
  if (obj > new Date()) return 'La data di nascita non può essere nel futuro';
  return '';
};

const inputClass = 'w-full p-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-shadow';
const labelClass = 'flex flex-row items-center gap-2';

export function ClientForm({
  value,
  onChange,
  errors,
  lockEmail = false,
  lockPhone = false,
  showPassword: showPasswordField = true,
  showNote = false,
}: ClientFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const set = <K extends keyof ClientFormValue>(key: K, v: ClientFormValue[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-start gap-4 w-full flex-wrap">
        <div className="flex flex-1 min-w-40 flex-col gap-2">
          <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Nome *</span></label>
          <input type="text" className={inputClass} value={value.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} />
          {errors?.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
        </div>
        <div className="flex flex-1 min-w-40 flex-col gap-2">
          <label className={labelClass}><User className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Cognome *</span></label>
          <input type="text" className={inputClass} value={value.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} />
          {errors?.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <label className={labelClass}><VenusAndMars className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Genere</span></label>
          <ToggleButton
            options={[Gender.MALE, Gender.FEMALE]}
            value={value.gender ?? Gender.MALE}
            onChange={(v) => set('gender', v)}
            className="h-10"
          />
          {errors?.gender && <p className="text-xs text-red-500">{errors.gender}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <label className={labelClass}><Plane className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Turista</span></label>
          <CustomCheckbox checked={value.isTourist ?? false} onChange={(v) => set('isTourist', v)} />
        </div>
      </div>

      <div className="flex flex-row items-start gap-4 w-full flex-wrap">
        <div className="flex flex-1 min-w-48 flex-col gap-2">
          <label className={labelClass}><AtSign className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Email{lockEmail ? '' : ' (opzionale)'}</span></label>
          <input
            type="email"
            className={`${inputClass} ${lockEmail ? 'opacity-60 cursor-not-allowed' : ''}`}
            value={value.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="off"
            disabled={lockEmail}
          />
          {errors?.email && <p className="text-xs text-red-500">{errors.email}</p>}
          {!lockEmail && <p className="text-xs text-zinc-400">Aggiungi un&apos;email per permettere al cliente di accedere via email.</p>}
        </div>
        <div className="flex flex-1 min-w-48 flex-col gap-2">
          <label className={labelClass}><Phone className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Telefono{lockPhone ? '' : ' (opzionale)'}</span></label>
          <PhoneNumber
            prefixCode={value.phonePrefix ?? '+39'}
            phoneNumber={value.phoneNumber ?? ''}
            onPrefixChange={(v) => set('phonePrefix', v)}
            onPhoneChange={(v) => set('phoneNumber', v)}
            disabled={lockPhone}
          />
          {errors?.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
          {!lockPhone && <p className="text-xs text-zinc-400">Aggiungi un telefono per permettere al cliente di accedere via telefono.</p>}
        </div>
      </div>

      <div className="flex flex-row items-start gap-4 w-full flex-wrap">
        {showPasswordField && (
          <div className="flex flex-1 min-w-48 flex-col gap-2">
            <label className={labelClass}><Lock className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Password App *</span></label>
            <div className="relative">
              <input
                type={passwordVisible ? 'text' : 'password'}
                className={inputClass}
                value={value.password ?? ''}
                onChange={(e) => set('password', e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                aria-label={passwordVisible ? 'Nascondi password' : 'Mostra password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={() => setPasswordVisible((v) => !v)}
              >
                {passwordVisible ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
              </button>
            </div>
            {errors?.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>
        )}
        <div className="flex flex-1 min-w-48 flex-col gap-2">
          <label className={labelClass}><Calendar className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Data di nascita</span></label>
          <input
            type="text"
            className={inputClass}
            placeholder="GG/MM/AAAA"
            value={value.birthDate ?? ''}
            onChange={(e) => set('birthDate', e.target.value)}
          />
          {errors?.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
        </div>
      </div>

      {showNote && (
        <div className="flex flex-col gap-2">
          <label className={labelClass}><FileHeart className="size-4 text-zinc-900 dark:text-zinc-100" /><span className="text-sm">Note</span></label>
          <textarea className={inputClass} rows={3} value={value.note ?? ''} onChange={(e) => set('note', e.target.value)} />
        </div>
      )}
    </div>
  );
}
