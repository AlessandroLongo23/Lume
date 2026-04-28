'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '@/lib/stores/preferences';

const SIDEBAR_KEY = 'lume-sidebar-collapsed';

/**
 * Apply non-theme appearance preferences (density, sidebar default) to the
 * document once the preferences store hydrates. Theme is handled directly
 * in `ThemeProvider`.
 *
 * - Density → `data-density="compact" | "comfortable"` on `<html>`.
 * - Sidebar default → seeds `lume-sidebar-collapsed` in localStorage when
 *   nothing is set yet, so a fresh device matches the user's choice.
 */
export function useAppearanceSync() {
  useEffect(() => {
    const apply = (state: ReturnType<typeof usePreferencesStore.getState>) => {
      if (!state.isLoaded) return;
      const density = state.preferences.appearance?.density ?? 'comfortable';
      document.documentElement.setAttribute('data-density', density);

      const sidebarDefault = state.preferences.appearance?.sidebarDefault;
      if (sidebarDefault && localStorage.getItem(SIDEBAR_KEY) === null) {
        localStorage.setItem(SIDEBAR_KEY, sidebarDefault === 'collapsed' ? '1' : '0');
      }
    };

    apply(usePreferencesStore.getState());
    return usePreferencesStore.subscribe(apply);
  }, []);
}
