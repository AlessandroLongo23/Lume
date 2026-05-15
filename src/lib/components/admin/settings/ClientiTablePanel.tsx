'use client';

import { Cake, RotateCcw } from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
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
        icon={Cake}
        title="Promemoria compleanni"
        description="Mostra un badge accanto alla data di nascita in elenco clienti quando il compleanno si avvicina."
      >
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 -mx-6">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Mostra promemoria
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Attiva il badge con il conto alla rovescia accanto alla data di nascita.
              </p>
            </div>
            <Switch
              checked={current.enabled}
              onChange={() => void persist({ enabled: !current.enabled })}
            />
          </div>

          <div
            className={`px-6 py-3 flex items-center justify-between gap-4 transition-opacity ${
              current.enabled ? 'opacity-100' : 'opacity-50'
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Soglia giorni
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Il badge appare a partire da N giorni prima del compleanno.
              </p>
            </div>
            <div className="w-28 shrink-0">
              <NumberInput
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
