'use client';

import { LayoutGrid, TableProperties, Calendar, RotateCcw, Eye } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
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

type Option<T extends string> = { value: T; label: string; icon: React.ElementType };

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

function SegmentedRow<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map(({ value: v, label, icon: Icon }) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selected
                ? 'border-primary bg-primary/10 text-primary-hover dark:text-primary/80'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

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
        icon={Eye}
        title="Clienti"
        description="Vista predefinita all'apertura della pagina Clienti."
      >
        <SegmentedRow
          value={clienti}
          options={CLIENTI_OPTS}
          onChange={(v) => void persist({ defaultViews: { clienti: v } })}
          ariaLabel="Clienti"
        />
      </SettingsCard>

      <SettingsCard
        icon={Eye}
        title="Fiches"
        description="Vista predefinita all'apertura della pagina Fiches."
      >
        <SegmentedRow
          value={fiches}
          options={FICHES_OPTS}
          onChange={(v) => void persist({ defaultViews: { fiches: v } })}
          ariaLabel="Fiches"
        />
      </SettingsCard>

      <SettingsCard
        icon={Eye}
        title="Ordini"
        description="Vista predefinita all'apertura della pagina Ordini."
      >
        <SegmentedRow
          value={ordini}
          options={ORDINI_OPTS}
          onChange={(v) => void persist({ defaultViews: { ordini: v } })}
          ariaLabel="Ordini"
        />
      </SettingsCard>

      <SettingsCard
        icon={Eye}
        title="Calendario"
        description="Vista predefinita all'apertura del calendario."
      >
        <SegmentedRow
          value={calendario}
          options={CALENDARIO_OPTS}
          onChange={(v) => void persist({ defaultViews: { calendario: v } })}
          ariaLabel="Calendario"
        />
      </SettingsCard>

      <p className="px-1 text-xs text-zinc-500">
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
