'use client';

import { useRef, useState } from 'react';
import { User, VenusAndMars, AtSign, Phone, Lock, Calendar, Plane, FileHeart, Camera, Trash2, Palette } from 'lucide-react';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { Button } from '@/lib/components/shared/ui/Button';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { Gender } from '@/lib/types/Gender';
import type { Client } from '@/lib/types/Client';
import { supabase } from '@/lib/supabase/client';
import { ColorSwatchPicker } from '@/lib/components/shared/ui/forms/ColorSwatchPicker';

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
  salonId?: string;
  clientId?: string;
}

const PHOTO_MAX_EDGE = 1024;
const PHOTO_QUALITY = 0.85;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob-failed'))),
        'image/jpeg',
        PHOTO_QUALITY
      );
    });
  } finally {
    bitmap.close?.();
  }
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

export function ClientForm({
  value,
  onChange,
  errors,
  lockEmail = false,
  lockPhone = false,
  showPassword: showPasswordField = true,
  showNote = false,
  salonId,
  clientId,
}: ClientFormProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ClientFormValue>(key: K, v: ClientFormValue[K]) => onChange({ ...value, [key]: v });

  const photoInitials = `${(value.firstName ?? '').charAt(0)}${(value.lastName ?? '').charAt(0)}`.toUpperCase();
  const canUpload = !!salonId && !!clientId;

  const onPickPhoto = () => fileInputRef.current?.click();

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!canUpload) {
      messagePopup.getState().error('Salva il cliente prima di caricare una foto');
      return;
    }
    if (!file.type.startsWith('image/')) {
      messagePopup.getState().error('Seleziona un file immagine');
      return;
    }
    setUploading(true);
    try {
      const blob = await compressImage(file);
      const path = `${salonId}/${clientId}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('client-photos')
        .upload(path, blob, { upsert: true, cacheControl: '3600', contentType: 'image/jpeg' });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('client-photos').getPublicUrl(path);
      onChange({ ...value, photoUrl: data.publicUrl });
      messagePopup.getState().success('Immagine aggiornata');
    } catch (err) {
      console.error(err);
      messagePopup.getState().error("Impossibile leggere l'immagine. Prova un altro file.");
    } finally {
      setUploading(false);
    }
  };

  const onRemovePhoto = () => onChange({ ...value, photoUrl: null });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <div className="size-20 rounded-full overflow-hidden bg-active flex items-center justify-center">
          {value.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-lg font-medium text-[var(--lume-text-secondary)]">
              {photoInitials || '·'}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leadingIcon={Camera}
              loading={uploading}
              disabled={!canUpload}
              onClick={onPickPhoto}
            >
              {uploading ? 'Caricamento…' : value.photoUrl ? 'Cambia immagine' : 'Carica immagine'}
            </Button>
            {value.photoUrl && !uploading && (
              <Button
                variant="ghost-destructive"
                leadingIcon={Trash2}
                onClick={onRemovePhoto}
              >
                Rimuovi
              </Button>
            )}
          </div>
          <p className="text-xs text-[var(--lume-text-muted)]">L&apos;immagine viene compressa automaticamente.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex flex-row items-start gap-4 w-full flex-wrap">
        <FormInput
          fieldClassName="flex-1 min-w-40"
          label="Nome"
          labelIcon={User}
          required
          type="text"
          data-tour="field-client-first_name"
          value={value.firstName ?? ''}
          error={errors?.firstName}
          onChange={(e) => set('firstName', e.target.value)}
        />
        <FormInput
          fieldClassName="flex-1 min-w-40"
          label="Cognome"
          labelIcon={User}
          required
          type="text"
          data-tour="field-client-last_name"
          value={value.lastName ?? ''}
          error={errors?.lastName}
          onChange={(e) => set('lastName', e.target.value)}
        />
        <Field className="shrink-0" label="Genere" labelIcon={VenusAndMars} error={errors?.gender}>
          {() => (
            <ToggleButton
              ariaLabel="Genere"
              options={[Gender.MALE, Gender.FEMALE]}
              value={value.gender ?? Gender.MALE}
              onChange={(v) => set('gender', v)}
            />
          )}
        </Field>
        <Field className="shrink-0 items-center" label="Turista" labelIcon={Plane}>
          {({ id }) => (
            <Checkbox id={id} checked={value.isTourist ?? false} onChange={(e) => set('isTourist', e.target.checked)} />
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-row items-start gap-4 w-full flex-wrap">
          <FormInput
            fieldClassName="flex-1 min-w-48"
            label={`Email${lockEmail ? '' : ' (opzionale)'}`}
            labelIcon={AtSign}
            type="email"
            value={value.email ?? ''}
            error={errors?.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete="off"
            disabled={lockEmail}
          />
          <Field
            className="flex-1 min-w-48"
            label={`Telefono${lockPhone ? '' : ' (opzionale)'}`}
            labelIcon={Phone}
            error={errors?.phoneNumber}
          >
            {({ id, invalid }) => (
              <PhoneNumber
                id={id}
                invalid={invalid}
                prefixCode={value.phonePrefix ?? '+39'}
                phoneNumber={value.phoneNumber ?? ''}
                onPrefixChange={(v) => set('phonePrefix', v)}
                onPhoneChange={(v) => set('phoneNumber', v)}
                disabled={lockPhone}
              />
            )}
          </Field>
        </div>
        {!lockEmail && !lockPhone && (
          <p className="text-xs text-[var(--lume-text-muted)]">
            Senza email o telefono il cliente non potrà accedere o prenotare online. Potrai aggiungere queste informazioni in seguito.
          </p>
        )}
      </div>

      <div className="flex flex-row items-start gap-4 w-full flex-wrap">
        {showPasswordField && (
          <FormInput
            fieldClassName="flex-1 min-w-48"
            label="Password App"
            labelIcon={Lock}
            required
            type="password"
            value={value.password ?? ''}
            error={errors?.password}
            onChange={(e) => set('password', e.target.value)}
            autoComplete="off"
          />
        )}
        <FormInput
          fieldClassName="flex-1 min-w-48"
          label="Data di nascita"
          labelIcon={Calendar}
          type="text"
          placeholder="GG/MM/AAAA"
          value={value.birthDate ?? ''}
          error={errors?.birthDate}
          onChange={(e) => set('birthDate', e.target.value)}
        />
      </div>

      {showNote && (
        <TextArea label="Note" labelIcon={FileHeart} rows={3} value={value.note ?? ''} onChange={(e) => set('note', e.target.value)} />
      )}

      <Field label="Colore cliente" labelIcon={Palette}>
        {() => (
          <ColorSwatchPicker
            value={value.color ?? null}
            onChange={(color) => set('color', color)}
            allowAuto={!!clientId}
            ariaLabel="Colore cliente"
            hint="Puoi cambiare il colore in qualsiasi momento."
          />
        )}
      </Field>
    </div>
  );
}
