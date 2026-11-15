'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { Button } from '@/lib/components/shared/ui/Button';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
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
  const [allowSelfUnavail, setAllowSelfUnavail] = useState<boolean>(
    settings?.allow_operator_self_unavailability ?? false,
  );
  const [colorByClient, setColorByClient] = useState<boolean>(
    settings?.color_by_client ?? true,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoaded || !settings) return;
    setSlotMin(settings.slot_granularity_min ?? 15);
    setDefaultDuration(settings.default_appointment_duration_min ?? 30);
    setAllowSelfUnavail(settings.allow_operator_self_unavailability ?? false);
    setColorByClient(settings.color_by_client ?? true);
  }, [isLoaded, settings]);

  const isDirty =
    settings !== null &&
    (settings.slot_granularity_min !== slotMin ||
      settings.default_appointment_duration_min !== defaultDuration ||
      settings.allow_operator_self_unavailability !== allowSelfUnavail ||
      settings.color_by_client !== colorByClient);

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
        allow_operator_self_unavailability: allowSelfUnavail,
        color_by_client: colorByClient,
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
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Granularità slot"
        description="Lunghezza minima degli intervalli mostrati nel calendario."
      >
        <ToggleButton
          ariaLabel="Granularità slot"
          options={[...SLOT_OPTIONS]}
          labels={SLOT_OPTIONS.map((m) => `${m} min`)}
          value={slotMin}
          onChange={setSlotMin}
          className="tabular-nums"
        />
      </SettingsCard>

      <SettingsCard
        title="Durata appuntamento predefinita"
        description="Durata iniziale di un nuovo appuntamento creato dal calendario."
      >
        <FormInput
          type="number"
          aria-label="Durata appuntamento predefinita in minuti"
          suffix="minuti"
          min={5}
          max={480}
          step={5}
          value={defaultDuration}
          onChange={(e) => setDefaultDuration(Math.max(5, Math.min(480, Number(e.target.value) || 5)))}
          fieldClassName="w-36"
          className="tabular-nums"
        />
      </SettingsCard>

      <SettingsCard
        title="Non disponibilità operatori"
        description="Quando attivo, ogni operatore può aggiungere e modificare le proprie ferie e non disponibilità dal calendario."
      >
        <SwitchRow
          label="Permetti agli operatori di gestire le proprie non disponibilità"
          checked={allowSelfUnavail}
          onChange={() => setAllowSelfUnavail((v) => !v)}
        />
      </SettingsCard>

      <SettingsCard
        title="Colore appuntamenti"
        description="Quando attivo, tutti gli appuntamenti dello stesso cliente hanno lo stesso colore — utile per riconoscere a colpo d’occhio una visita divisa tra più operatori. Disattiva per colorare gli appuntamenti in base alla categoria del servizio."
      >
        <SwitchRow
          label="Stesso colore per cliente"
          checked={colorByClient}
          onChange={() => setColorByClient((v) => !v)}
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
