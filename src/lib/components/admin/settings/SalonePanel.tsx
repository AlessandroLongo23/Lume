'use client';

import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { WorkingHoursForm } from './WorkingHoursForm';

export function SalonePanel() {
  const isLoading = useSalonSettingsStore((s) => s.isLoading);
  const settings = useSalonSettingsStore((s) => s.settings);
  const updateSettings = useSalonSettingsStore((s) => s.updateSettings);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-zinc-400">Caricamento impostazioni...</div>
      </div>
    );
  }

  return (
    <WorkingHoursForm
      title="Orari di Apertura"
      description="Configura i giorni di apertura e le fasce orarie del salone."
      initialValue={settings?.operating_hours ?? null}
      onSubmit={async (operating_hours) => {
        try {
          await updateSettings({ operating_hours });
          messagePopup.getState().success('Orari salvati');
        } catch {
          messagePopup.getState().error('Errore durante il salvataggio');
          throw new Error('save-failed');
        }
      }}
    />
  );
}
