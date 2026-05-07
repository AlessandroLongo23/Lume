'use client';

import { Bell, RotateCcw } from 'lucide-react';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { Button } from '@/lib/components/shared/ui/Button';
import { SettingsCard } from './SettingsCard';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';

type Key = 'lowStock' | 'noShow' | 'newBooking' | 'dailyDigest';

const ITEMS: { key: Key; label: string; description: string }[] = [
  {
    key: 'lowStock',
    label: 'Scorte sotto soglia',
    description: 'Avvisi quando un prodotto scende sotto la soglia minima.',
  },
  {
    key: 'noShow',
    label: 'No-show',
    description: 'Avvisi quando un appuntamento risulta non presentato.',
  },
  {
    key: 'newBooking',
    label: 'Nuove prenotazioni',
    description: 'Notifica appena un nuovo appuntamento entra in calendario.',
  },
  {
    key: 'dailyDigest',
    label: 'Riepilogo giornaliero',
    description: 'Riepilogo email delle prenotazioni e attività della giornata.',
  },
];

export function NotifichePanel() {
  const preferences = usePreferencesStore((s) => s.preferences);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const fac = FACTORY_PREFERENCES.notifications;
  const current = (k: Key) => preferences.notifications?.[k] ?? fac[k];

  const persist = async (patch: Partial<Record<Key, boolean>>) => {
    try {
      await updatePreferences({ notifications: patch });
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    }
  };

  const reset = () => {
    void persist({ ...fac });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Bell}
        title="Notifiche in-app"
        description="Avvisi mostrati nella dashboard. Personali al tuo account."
      >
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 -mx-6">
          {ITEMS.map(({ key, label, description }) => (
            <li key={key} className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
              </div>
              <Switch
                checked={current(key)}
                onChange={() => void persist({ [key]: !current(key) })}
              />
            </li>
          ))}
        </ul>
      </SettingsCard>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={reset}>
          Ripristina default
        </Button>
      </div>
    </div>
  );
}
