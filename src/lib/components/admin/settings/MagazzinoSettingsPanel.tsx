'use client';

import { useEffect, useState } from 'react';
import { Warehouse, Save, Loader2 } from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
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
        <Loader2 className="size-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Warehouse}
        title="Gestione scorte"
        description="Mostra colonne di giacenza e soglia minima nel magazzino prodotti."
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Tracciamento avanzato</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Disattivalo se non vuoi tracciare quantità e soglie.
            </p>
          </div>
          <Switch checked={trackInventory} onChange={() => setTrackInventory((v) => !v)} />
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Warehouse}
        title="Soglia di scorta minima predefinita"
        description="Soglia iniziale quando crei un nuovo prodotto. Modificabile per ogni prodotto."
      >
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={9999}
            value={threshold}
            onChange={(e) => setThreshold(Math.max(0, Math.min(9999, Number(e.target.value) || 0)))}
            className="w-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <span className="text-sm text-zinc-500">unità</span>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="size-4" />
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  );
}
