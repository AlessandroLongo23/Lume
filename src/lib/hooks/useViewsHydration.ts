'use client';

import { useEffect } from 'react';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { useViewsStore } from '@/lib/stores/views';
import { useCalendarStore } from '@/lib/stores/calendar';

/**
 * On the first time preferences hydrate in a session, copy the user's
 * preferred default views into the session-only `useViewsStore` and
 * `useCalendarStore`. Subsequent in-session view toggles are NOT written
 * back to preferences — preferences are authoritative only at first paint.
 */
export function useViewsHydration() {
  useEffect(() => {
    let applied = false;
    const apply = (state: ReturnType<typeof usePreferencesStore.getState>) => {
      if (applied || !state.isLoaded) return;
      applied = true;
      const v = state.preferences.defaultViews ?? {};

      const viewsPatch: Partial<{
        clients: 'table' | 'grid';
        fiches: 'table' | 'grid';
        orders: 'table' | 'calendar';
      }> = {};
      if (v.clienti === 'table' || v.clienti === 'grid') viewsPatch.clients = v.clienti;
      if (v.fiches === 'table' || v.fiches === 'grid') viewsPatch.fiches = v.fiches;
      if (v.ordini === 'table' || v.ordini === 'calendar') viewsPatch.orders = v.ordini;
      if (Object.keys(viewsPatch).length > 0) {
        useViewsStore.setState(viewsPatch);
      }

      if (v.calendario === 'day' || v.calendario === 'week' || v.calendario === 'month') {
        // Use setView when possible so its own gating logic runs (e.g. week
        // requires an operator). Fall back to direct set if needed.
        if (v.calendario === 'week') {
          useCalendarStore.setState({ currentView: 'week' });
        } else {
          useCalendarStore.getState().setView(v.calendario);
        }
      }
    };

    apply(usePreferencesStore.getState());
    return usePreferencesStore.subscribe(apply);
  }, []);
}
