'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { User, Camera, Save, Trash2, Loader2, Phone } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { PhoneNumber } from '@/lib/components/shared/ui/forms/PhoneNumber';
import { supabase } from '@/lib/supabase/client';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

function getInitials(first: string, last: string, email: string): string {
  const a = (first || '').charAt(0);
  const b = (last || '').charAt(0);
  const init = (a + b).trim().toUpperCase();
  if (init) return init;
  return (email.charAt(0) || '?').toUpperCase();
}

export function ProfiloPanel() {
  const isLoading = usePreferencesStore((s) => s.isLoading);
  const firstName = usePreferencesStore((s) => s.firstName);
  const lastName = usePreferencesStore((s) => s.lastName);
  const email = usePreferencesStore((s) => s.email);
  const avatarUrl = usePreferencesStore((s) => s.avatarUrl);
  const phonePrefix = usePreferencesStore((s) => s.phonePrefix);
  const phoneNumber = usePreferencesStore((s) => s.phoneNumber);
  const updateProfile = usePreferencesStore((s) => s.updateProfile);

  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [prefix, setPrefix] = useState(phonePrefix);
  const [phone, setPhone] = useState(phoneNumber);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFirst(firstName); }, [firstName]);
  useEffect(() => { setLast(lastName); }, [lastName]);
  useEffect(() => { setPrefix(phonePrefix); }, [phonePrefix]);
  useEffect(() => { setPhone(phoneNumber); }, [phoneNumber]);

  const isDirty =
    first.trim() !== firstName ||
    last.trim() !== lastName ||
    prefix !== phonePrefix ||
    phone.trim() !== phoneNumber;

  const onSaveName = async () => {
    if (!isDirty) return;
    const f = first.trim();
    const l = last.trim();
    if (!f || !l) {
      messagePopup.getState().error('Nome e cognome sono obbligatori');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        first_name: f,
        last_name: l,
        phone_prefix: prefix,
        phone_number: phone.trim(),
      });
      // Mirror into the subscription store so the sidebar user card stays in sync.
      useSubscriptionStore.setState({ firstName: f, lastName: l });
      messagePopup.getState().success('Profilo aggiornato');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      messagePopup.getState().error('Formato non supportato (PNG, JPEG, WebP)');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      messagePopup.getState().error('Immagine troppo grande (max 5 MB)');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('not-auth');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('user-avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('user-avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      await updateProfile({ avatar_url: publicUrl });
      messagePopup.getState().success('Immagine aggiornata');
    } catch (err) {
      console.error(err);
      messagePopup.getState().error("Errore durante il caricamento dell'immagine");
    } finally {
      setUploading(false);
    }
  };

  const onRemoveAvatar = async () => {
    try {
      await updateProfile({ avatar_url: null });
      messagePopup.getState().success('Immagine rimossa');
    } catch {
      messagePopup.getState().error('Errore durante la rimozione');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Camera}
        title="Immagine del profilo"
        description="Carica un'immagine quadrata (PNG, JPEG o WebP, max 5 MB)."
      >
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-full overflow-hidden bg-primary/15 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-primary-hover dark:text-primary/80">
                {getInitials(first, last, email)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPickFile}
                disabled={uploading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                {uploading ? 'Caricamento…' : avatarUrl ? 'Cambia immagine' : 'Carica immagine'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Rimuovi
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={onFileChange}
              className="hidden"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard icon={User} title="Informazioni personali">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome
            </label>
            <input
              id="first-name"
              type="text"
              maxLength={80}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="last-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cognome
            </label>
            <input
              id="last-name"
              type="text"
              maxLength={80}
              value={last}
              onChange={(e) => setLast(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              {"Modifica l'email dalla sezione Account."}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              <Phone className="size-3.5" /> Telefono
            </label>
            <PhoneNumber
              prefixCode={prefix}
              phoneNumber={phone}
              onPrefixChange={setPrefix}
              onPhoneChange={setPhone}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onSaveName}
            disabled={saving || !isDirty}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="size-4" />
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
