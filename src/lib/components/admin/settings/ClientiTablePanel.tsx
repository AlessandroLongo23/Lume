'use client';

import { RotateCcw } from 'lucide-react';
import { useId } from 'react';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Button } from '@/lib/components/shared/ui/Button';
import { SettingsCard } from './SettingsCard';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import type { BirthdayReminderPreference } from '@/lib/types/Preferences';

const FACTORY: BirthdayReminderPreference = {
  enabled: FACTORY_PREFERENCES.clientsTable.birthdayReminder.enabled,
  daysAhead: FACTORY_PREFERENCES.clientsTable.birthdayReminder.daysAhead,
};

export function ClientiTablePanel() {
  const preferences = usePreferencesStore((s) => s.preferences);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);
  const daysId = useId();

  const current: BirthdayReminderPreference =
    preferences.clientsTable?.birthdayReminder ?? FACTORY;

  const persist = async (patch: Partial<BirthdayReminderPreference>) => {
    try {
      await updatePreferences({
        clientsTable: { birthdayReminder: { ...current, ...patch } },
      });
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    }
  };

  const reset = () => {
    void persist({ ...FACTORY });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Promemoria compleanni"
        description="Mostra un badge accanto alla data di nascita in elenco clienti quando il compleanno si avvicina."
      >
        <div className="flex flex-col divide-y divide-line">
          <SwitchRow
            label="Mostra promemoria"
            description="Attiva il badge con il conto alla rovescia accanto alla data di nascita."
            checked={current.enabled}
            onChange={() => void persist({ enabled: !current.enabled })}
            className="py-3"
          />

          <div
            className={`py-3 flex items-center justify-between gap-4 transition-opacity ${
              current.enabled ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div className="min-w-0">
              {/* ds-ignore: a setting row with the number on the right, matching the SwitchRow above; Field stacks label, control and hint */}
              <label htmlFor={daysId} className="block text-sm font-medium text-[var(--lume-text)]">
                Soglia giorni
              </label>
              <p id={`${daysId}-hint`} className="text-xs text-[var(--lume-text-secondary)] mt-0.5">
                Il badge appare a partire da N giorni prima del compleanno.
              </p>
            </div>
            <div className="w-28 shrink-0">
              <NumberInput
                id={daysId}
                aria-describedby={`${daysId}-hint`}
                value={current.daysAhead}
                onChange={(v) => {
                  if (v == null) return;
                  void persist({ daysAhead: v });
                }}
                min={1}
                max={365}
                step={1}
                suffix="g"
                size="sm"
                disabled={!current.enabled}
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={reset}>
          Ripristina default
        </Button>
      </div>
    </div>
  );
}
