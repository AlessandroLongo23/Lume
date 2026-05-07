'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Save, Trash2, Loader2, Palette } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const FAVICON_ACCEPT = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];

const SWATCHES = ['#6366F1', '#0EA5E9', '#14B8A6', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899'];

function ImageUploader({
  kind,
  url,
  accept,
  description,
}: {
  kind: 'logo' | 'favicon';
  url: string | null;
  accept: string[];
  description: string;
}) {
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const applyLocal = useSalonSettingsStore((s) => s.applyLocal);

  const onPick = () => fileInput.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!accept.includes(file.type)) {
      messagePopup.getState().error('Formato non supportato');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      messagePopup.getState().error('File troppo grande (max 5 MB)');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('file', file);
      const res = await fetch('/api/settings/branding', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'upload failed');
      applyLocal(kind === 'logo' ? { logo_url: data.url } : { favicon_url: data.url });
      if (kind === 'logo') useSubscriptionStore.setState({ logoUrl: data.url });
      messagePopup.getState().success('Immagine caricata');
    } catch (err) {
      console.error(err);
      messagePopup.getState().error('Errore durante il caricamento');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/settings/branding?kind=${kind}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      applyLocal(kind === 'logo' ? { logo_url: null } : { favicon_url: null });
      if (kind === 'logo') useSubscriptionStore.setState({ logoUrl: null });
      messagePopup.getState().success('Immagine rimossa');
    } catch {
      messagePopup.getState().error('Errore durante la rimozione');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-5">
      <div className="size-20 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
        {url ? (
          <Image src={url} alt={kind} width={80} height={80} className="size-full object-contain" />
        ) : (
          <ImagePlus className="size-6 text-zinc-300 dark:text-zinc-600" />
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <p className="text-xs text-zinc-500">{description}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leadingIcon={ImagePlus}
            loading={busy}
            onClick={onPick}
          >
            {url ? 'Sostituisci' : 'Carica'}
          </Button>
          {url && (
            <Button
              variant="ghost"
              leadingIcon={Trash2}
              disabled={busy}
              onClick={onRemove}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              Rimuovi
            </Button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={accept.join(',')}
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

export function BrandingPanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [color, setColor] = useState<string>(settings?.brand_color ?? '');
  const [savingColor, setSavingColor] = useState(false);

  useEffect(() => {
    setColor(settings?.brand_color ?? '');
  }, [settings?.brand_color]);

  const onSaveColor = async () => {
    const trimmed = color.trim();
    if (trimmed && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
      messagePopup.getState().error('Colore non valido (formato esadecimale)');
      return;
    }
    setSavingColor(true);
    try {
      await updateSettings({ brand_color: trimmed || null });
      messagePopup.getState().success('Colore salvato');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSavingColor(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const colorIsDirty = (settings?.brand_color ?? '') !== color.trim();

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={ImagePlus}
        title="Logo"
        description="Mostrato nella barra laterale, ricevute e pagine pubbliche."
      >
        <ImageUploader
          kind="logo"
          url={settings?.logo_url ?? null}
          accept={LOGO_ACCEPT}
          description="PNG, JPEG, WebP o SVG. Max 5 MB. Consigliato 512×512 o vettoriale."
        />
      </SettingsCard>

      <SettingsCard
        icon={ImagePlus}
        title="Favicon"
        description="L'icona mostrata nella scheda del browser."
      >
        <ImageUploader
          kind="favicon"
          url={settings?.favicon_url ?? null}
          accept={FAVICON_ACCEPT}
          description="PNG, ICO o SVG. Max 5 MB. Consigliato 32×32 o 64×64."
        />
      </SettingsCard>

      <SettingsCard
        icon={Palette}
        title="Colore principale"
        description="Usato per accenti su ricevute e materiali brandizzati. Lascia vuoto per il default Lume."
      >
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="color"
            value={color || '#6366F1'}
            onChange={(e) => setColor(e.target.value)}
            className="size-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366F1"
            maxLength={9}
            className="w-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <div className="flex items-center gap-1.5">
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setColor(s)}
                aria-label={`Imposta ${s}`}
                className="size-6 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm transition-transform hover:scale-110"
                style={{ backgroundColor: s }}
              />
            ))}
          </div>
          <Button
            variant="primary"
            leadingIcon={Save}
            loading={savingColor}
            disabled={!colorIsDirty}
            onClick={onSaveColor}
            className="ml-auto"
          >
            {savingColor ? 'Salvataggio…' : 'Salva'}
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
