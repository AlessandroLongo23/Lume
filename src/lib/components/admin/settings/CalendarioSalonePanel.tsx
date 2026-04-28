'use client';

import { useEffect, useState } from 'react';
import { Calendar, Save, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

const SLOT_OPTIONS = [5, 10, 15, 30] as const;

export function CalendarioSalonePanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const isLoaded = useSalonSettingsStore((s) => s.isLoaded);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  const [slotMin, setSlotMin] = useState<number>(settings?.slot_granularity_min ?? 15);
  const [defaultDuration, setDefaultDuration] = useState<number>(settings?.default_appointment_duration_min ?? 30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !settings) return;
    setSlotMin(settings.slot_granularity_min ?? 15);
    setDefaultDuration(settings.default_appointment_duration_min ?? 30);
  }, [isLoaded, settings]);

  const isDirty =
    settings !== null &&
    (settings.slot_granularity_min !== slotMin ||
      settings.default_appointment_duration_min !== defaultDuration);

  const onSave = async () => {
    if (!Number.isInteger(defaultDuration) || defaultDuration < 5 || defaultDuration > 480) {
      messagePopup.getState().error('Durata appuntamento non valida (5–480 min)');
      return;
    }
    setSaving(true);
    try {
      await updateSettings({
        slot_granularity_min: slotMin,
        default_appointment_duration_min: defaultDuration,
      });
      messagePopup.getState().success('Impostazioni calendario salvate');
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
        icon={Calendar}
        title="Granularità slot"
        description="Lunghezza minima degli intervalli mostrati nel calendario."
      >
        <div role="radiogroup" aria-label="Granularità slot" className="flex flex-wrap gap-2">
          {SLOT_OPTIONS.map((m) => {
            const selected = m === slotMin;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSlotMin(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/80'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                {m} min
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        icon={Calendar}
        title="Durata appuntamento predefinita"
        description="Durata iniziale di un nuovo appuntamento creato dal calendario."
      >
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={5}
            max={480}
            step={5}
            value={defaultDuration}
            onChange={(e) => setDefaultDuration(Math.max(5, Math.min(480, Number(e.target.value) || 5)))}
            className="w-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <span className="text-sm text-zinc-500">minuti</span>
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
