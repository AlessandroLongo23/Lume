'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Save, Trash2, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { ColorSwatchPicker } from '@/lib/components/shared/ui/forms/ColorSwatchPicker';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
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
      <div className="surface-card size-20 shrink-0 overflow-hidden flex items-center justify-center">
        {url ? (
          <Image src={url} alt={kind} width={80} height={80} className="size-full object-contain" />
        ) : (
          <ImagePlus className="size-6 text-[var(--lume-text-muted)]" />
        )}
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <p className="text-sm text-[var(--lume-text-secondary)]">{description}</p>
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
              variant="ghost-destructive"
              leadingIcon={Trash2}
              disabled={busy}
              onClick={onRemove}
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
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  const colorIsDirty = (settings?.brand_color ?? '') !== color.trim();

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
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
        title="Colore principale"
        description="Usato per accenti su ricevute e materiali brandizzati. Lascia vuoto per il default Lume."
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Native colour well: the system picker for any colour; no library piece wraps it. */}
          <input
            type="color"
            aria-label="Scegli il colore"
            value={color || '#6366F1'}
            onChange={(e) => setColor(e.target.value)}
            className="size-[var(--lume-control-h-md)] pointer-coarse:size-[var(--lume-control-h-lg)] rounded-lg border-0 edge bg-transparent cursor-pointer"
          />
          <FormInput
            aria-label="Colore esadecimale"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#6366F1"
            maxLength={9}
            fieldClassName="w-32"
            className="tabular-nums"
          />
          <ColorSwatchPicker
            value={color.toUpperCase() || null}
            onChange={(c) => setColor(c ?? '')}
            colors={SWATCHES}
            columns={SWATCHES.length}
            ariaLabel="Colori suggeriti"
          />
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
