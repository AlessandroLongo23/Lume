'use client';

import { Palette, Monitor, Sun, Moon, PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { useTheme, type Theme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import type { Density, SidebarDefault } from '@/lib/types/Preferences';

type Option<T extends string> = { value: T; label: string; icon: React.ElementType; hint?: string };

const THEME_OPTIONS: Option<Theme>[] = [
  { value: 'system', label: 'Sistema', icon: Monitor, hint: 'Segui le impostazioni del dispositivo' },
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
];

const DENSITY_OPTIONS: Option<Density>[] = [
  { value: 'comfortable', label: 'Comoda', icon: Monitor, hint: 'Spaziatura predefinita' },
  { value: 'compact', label: 'Compatta', icon: Monitor, hint: 'Più contenuto, meno spazio' },
];

const SIDEBAR_OPTIONS: Option<SidebarDefault>[] = [
  { value: 'open', label: 'Espansa', icon: PanelLeftOpen, hint: 'Mostra etichette dei link' },
  { value: 'collapsed', label: 'Compressa', icon: PanelLeftClose, hint: 'Solo icone' },
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
      {options.map(({ value: v, label, icon: Icon, hint }) => {
        const selected = v === value;
        return (
          <Tooltip key={v} label={hint}>
            <button
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
          </Tooltip>
        );
      })}
    </div>
  );
}

export function AspettoPanel() {
  const { theme, setTheme } = useTheme();
  const preferences = usePreferencesStore((s) => s.preferences);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const density: Density = preferences.appearance?.density ?? FACTORY_PREFERENCES.appearance.density;
  const sidebarDefault: SidebarDefault =
    preferences.appearance?.sidebarDefault ?? FACTORY_PREFERENCES.appearance.sidebarDefault;

  const persist = async (patch: Parameters<typeof updatePreferences>[0]) => {
    try {
      await updatePreferences(patch);
    } catch {
      messagePopup.getState().error('Errore durante il salvataggio');
    }
  };

  const onThemeChange = (t: Theme) => {
    setTheme(t);
    void persist({ appearance: { theme: t } });
  };

  const onDensityChange = (d: Density) => {
    document.documentElement.setAttribute('data-density', d);
    void persist({ appearance: { density: d } });
  };

  const onSidebarDefaultChange = (s: SidebarDefault) => {
    void persist({ appearance: { sidebarDefault: s } });
  };

  const resetAll = () => {
    const fac = FACTORY_PREFERENCES.appearance;
    setTheme(fac.theme);
    document.documentElement.setAttribute('data-density', fac.density);
    void persist({ appearance: { theme: fac.theme, density: fac.density, sidebarDefault: fac.sidebarDefault } });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Palette}
        title="Tema"
        description="Scegli tra chiaro, scuro o segui le impostazioni di sistema."
      >
        <SegmentedRow value={theme} options={THEME_OPTIONS} onChange={onThemeChange} ariaLabel="Tema" />
      </SettingsCard>

      <SettingsCard
        icon={Monitor}
        title="Densità"
        description="Regola la spaziatura generale dell'interfaccia."
      >
        <SegmentedRow value={density} options={DENSITY_OPTIONS} onChange={onDensityChange} ariaLabel="Densità" />
      </SettingsCard>

      <SettingsCard
        icon={PanelLeftOpen}
        title="Barra laterale"
        description="Stato predefinito della barra laterale all'avvio su un nuovo dispositivo."
      >
        <SegmentedRow
          value={sidebarDefault}
          options={SIDEBAR_OPTIONS}
          onChange={onSidebarDefaultChange}
          ariaLabel="Barra laterale"
        />
      </SettingsCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
        >
          <RotateCcw className="size-3.5" />
          Ripristina default
        </button>
      </div>
    </div>
  );
}
