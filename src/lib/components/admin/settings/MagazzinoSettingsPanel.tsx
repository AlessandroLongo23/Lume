'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { SettingsCard } from './SettingsCard';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

export function MagazzinoSettingsPanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [trackInventory, setTrackInventory] = useState(settings?.track_inventory ?? false);
  const [threshold, setThreshold] = useState<number>(settings?.default_low_stock_threshold ?? 0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !settings) return;
    setTrackInventory(settings.track_inventory ?? false);
    setThreshold(settings.default_low_stock_threshold ?? 0);
  }, [isLoaded, settings]);

  const isDirty =
    settings !== null &&
    (settings.track_inventory !== trackInventory ||
      settings.default_low_stock_threshold !== threshold);

  const onSave = async () => {
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 9999) {
      messagePopup.getState().error('Soglia non valida (0–9999)');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        track_inventory: trackInventory,
        default_low_stock_threshold: threshold,
      });
      messagePopup.getState().success('Impostazioni magazzino salvate');
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Gestione scorte"
        description="Mostra colonne di giacenza e soglia minima nel magazzino prodotti."
      >
        <SwitchRow
          label="Tracciamento avanzato"
          description="Disattivalo se non vuoi tracciare quantità e soglie."
          checked={trackInventory}
          onChange={() => setTrackInventory((v) => !v)}
        />
      </SettingsCard>

      <SettingsCard
        title="Soglia di scorta minima predefinita"
        description="Soglia iniziale quando crei un nuovo prodotto. Modificabile per ogni prodotto."
      >
        <FormInput
          type="number"
          aria-label="Soglia di scorta minima predefinita"
          suffix="unità"
          min={0}
          max={9999}
          value={threshold}
          onChange={(e) => setThreshold(Math.max(0, Math.min(9999, Number(e.target.value) || 0)))}
          fieldClassName="w-36"
          className="tabular-nums"
        />
      </SettingsCard>

      <div className="flex justify-end">
        <Button
          variant="primary"
          leadingIcon={Save}
          loading={saving}
          disabled={!isDirty}
          onClick={onSave}
        >
          {saving ? 'Salvataggio…' : 'Salva'}
        </Button>
      </div>
    </div>
  );
}
