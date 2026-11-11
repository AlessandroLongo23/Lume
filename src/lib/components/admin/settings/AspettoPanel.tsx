'use client';

import { useSyncExternalStore } from 'react';
import { Monitor, Sun, Moon, PanelLeftClose, PanelLeftOpen, RotateCcw, AArrowUp, AArrowDown, Wand2, Type } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { OptionGroup, type Option } from '@/lib/components/shared/ui/forms/OptionGroup';
import { Button } from '@/lib/components/shared/ui/Button';
import { useTheme, type Theme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { FACTORY_PREFERENCES } from '@/lib/const/factory-defaults';
import type { Density, SidebarDefault } from '@/lib/types/Preferences';
import { applyUiScale, readUiScale, subscribeUiScale, type UiScale } from '@/lib/utils/uiScale';


const THEME_OPTIONS: Option<Theme>[] = [
  { value: 'system', label: 'Sistema', icon: Monitor, hint: 'Segui le impostazioni del dispositivo' },
  { value: 'light', label: 'Chiaro', icon: Sun },
  { value: 'dark', label: 'Scuro', icon: Moon },
];

const DENSITY_OPTIONS: Option<Density>[] = [
  { value: 'comfortable', label: 'Comoda', icon: Monitor, hint: 'Spaziatura predefinita' },
  { value: 'compact', label: 'Compatta', icon: Monitor, hint: 'Più contenuto, meno spazio' },
];

const UI_SCALE_OPTIONS: Option<UiScale>[] = [
  { value: 'auto', label: 'Automatica', icon: Wand2, hint: 'Compatta sugli schermi bassi, normale sugli altri' },
  { value: 'large', label: 'Grande', icon: AArrowUp, hint: 'Testo e pulsanti più grandi' },
  { value: 'normal', label: 'Normale', icon: Type },
  { value: 'compact', label: 'Compatta', icon: AArrowDown, hint: 'Per schermi piccoli, come 1366×768' },
  { value: 'extra-compact', label: 'Molto compatta', icon: AArrowDown, hint: 'Mostra più contenuto possibile' },
];

const SIDEBAR_OPTIONS: Option<SidebarDefault>[] = [
  { value: 'open', label: 'Espansa', icon: PanelLeftOpen, hint: 'Mostra etichette dei link' },
  { value: 'collapsed', label: 'Compressa', icon: PanelLeftClose, hint: 'Solo icone' },
];

export function AspettoPanel() {
  const { theme, setTheme } = useTheme();
  const preferences = usePreferencesStore((s) => s.preferences);
  // Per-device, so it comes from localStorage, not from the preferences store.
  const uiScale = useSyncExternalStore(subscribeUiScale, readUiScale, () => 'auto' as const);
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
    applyUiScale('auto');
    void persist({ appearance: { theme: fac.theme, density: fac.density, sidebarDefault: fac.sidebarDefault } });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Tema"
        description="Scegli tra chiaro, scuro o segui le impostazioni di sistema."
      >
        <OptionGroup value={theme} options={THEME_OPTIONS} onChange={onThemeChange} ariaLabel="Tema" />
      </SettingsCard>

      <SettingsCard
        title="Dimensione interfaccia"
        description="Rimpicciolisci tutta l'interfaccia per vedere più contenuto sugli schermi piccoli, o ingrandiscila per leggere meglio. Vale solo per questo dispositivo."
      >
        <OptionGroup
          value={uiScale}
          options={UI_SCALE_OPTIONS}
          onChange={applyUiScale}
          ariaLabel="Dimensione interfaccia"
        />
      </SettingsCard>

      <SettingsCard
        title="Densità"
        description="Regola la spaziatura generale dell'interfaccia."
      >
        <OptionGroup value={density} options={DENSITY_OPTIONS} onChange={onDensityChange} ariaLabel="Densità" />
      </SettingsCard>

      <SettingsCard
        title="Barra laterale"
        description="Stato predefinito della barra laterale all'avvio su un nuovo dispositivo."
      >
        <OptionGroup
          value={sidebarDefault}
          options={SIDEBAR_OPTIONS}
          onChange={onSidebarDefaultChange}
          ariaLabel="Barra laterale"
        />
      </SettingsCard>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" leadingIcon={RotateCcw} onClick={resetAll}>
          Ripristina default
        </Button>
      </div>
    </div>
  );
}
