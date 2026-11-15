'use client';

import { LayoutGrid, TableProperties, Calendar, RotateCcw } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { OptionGroup, type Option } from '@/lib/components/shared/ui/forms/OptionGroup';
import { Button } from '@/lib/components/shared/ui/Button';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import type {
  ClientiView,
  FichesView,
  OrdiniView,
  CalendarioView,
} from '@/lib/types/Preferences';


const CLIENTI_OPTS: Option<ClientiView>[] = [
  { value: 'table', label: 'Tabella', icon: TableProperties },
  { value: 'grid', label: 'Griglia', icon: LayoutGrid },
];
const FICHES_OPTS: Option<FichesView>[] = [
  { value: 'table', label: 'Tabella', icon: TableProperties },
  { value: 'grid', label: 'Griglia', icon: LayoutGrid },
];
const ORDINI_OPTS: Option<OrdiniView>[] = [
  { value: 'table', label: 'Tabella', icon: TableProperties },
  { value: 'calendar', label: 'Calendario', icon: Calendar },
];
const CALENDARIO_OPTS: Option<CalendarioView>[] = [
  { value: 'day', label: 'Giorno', icon: Calendar },
  { value: 'week', label: 'Settimana', icon: Calendar },
  { value: 'month', label: 'Mese', icon: Calendar },
];

export function DefaultVistaPanel() {
  const preferences = usePreferencesStore((s) => s.preferences);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const fac = FACTORY_PREFERENCES.defaultViews;
  const clienti = preferences.defaultViews?.clienti ?? fac.clienti;
  const fiches = preferences.defaultViews?.fiches ?? fac.fiches;
  const ordini = preferences.defaultViews?.ordini ?? fac.ordini;
  const calendario = preferences.defaultViews?.calendario ?? fac.calendario;

  const persist = async (patch: Parameters<typeof updatePreferences>[0]) => {
    try {
      await updatePreferences(patch);
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    }
  };

  const reset = () => {
    void persist({ defaultViews: { ...fac } });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Clienti"
        description="Vista predefinita all'apertura della pagina Clienti."
      >
        <OptionGroup
          value={clienti}
          options={CLIENTI_OPTS}
          onChange={(v) => void persist({ defaultViews: { clienti: v } })}
          ariaLabel="Clienti"
        />
      </SettingsCard>

      <SettingsCard
        title="Fiches"
        description="Vista predefinita all'apertura della pagina Fiches."
      >
        <OptionGroup
          value={fiches}
          options={FICHES_OPTS}
          onChange={(v) => void persist({ defaultViews: { fiches: v } })}
          ariaLabel="Fiches"
        />
      </SettingsCard>

      <SettingsCard
        title="Ordini"
        description="Vista predefinita all'apertura della pagina Ordini."
      >
        <OptionGroup
          value={ordini}
          options={ORDINI_OPTS}
          onChange={(v) => void persist({ defaultViews: { ordini: v } })}
          ariaLabel="Ordini"
        />
      </SettingsCard>

      <SettingsCard
        title="Calendario"
        description="Vista predefinita all'apertura del calendario."
      >
        <OptionGroup
          value={calendario}
          options={CALENDARIO_OPTS}
          onChange={(v) => void persist({ defaultViews: { calendario: v } })}
          ariaLabel="Calendario"
        />
      </SettingsCard>

      <p className="text-xs text-[var(--lume-text-muted)]">
        I valori scelti vengono applicati al prossimo accesso e su nuovi dispositivi. In sessione,
        i toggle in pagina restano locali e non sovrascrivono il default.
      </p>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={reset}>
          Ripristina default
        </Button>
      </div>
    </div>
  );
}
