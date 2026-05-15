'use client';

import { useCallback, useMemo } from 'react';
import { useOperatorsStore } from '@/lib/stores/operators';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Operator } from '@/lib/types/Operator';

interface ResolvedOperatorOrder {
  orderedOperators: Operator[];
  orderedIds: string[];
  setOrder: (ids: string[]) => void;
}

/**
 * Resolves the user's preferred operator ordering for the calendar.
 * Stale ids (deleted/archived) fall away on read; new operators land at the end.
 */
export function useOperatorOrder(): ResolvedOperatorOrder {
  const operators = useOperatorsStore((s) => s.operators);
  const pref = usePreferencesStore((s) => s.preferences.calendar?.operatorOrder);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const orderedOperators = useMemo(() => {
    const active = operators.filter((op) => !op.isArchived);
    const byId = new Map(active.map((op) => [op.id, op]));
    const seen = new Set<string>();
    const out: Operator[] = [];
    for (const id of pref ?? []) {
      const op = byId.get(id);
      if (op && !seen.has(id)) {
        out.push(op);
        seen.add(id);
      }
    }
    for (const op of active) {
      if (!seen.has(op.id)) out.push(op);
    }
    return out;
  }, [operators, pref]);

  const orderedIds = useMemo(() => orderedOperators.map((op) => op.id), [orderedOperators]);

  const setOrder = useCallback(
    (ids: string[]) => {
      void (async () => {
        try {
          await updatePreferences({ calendar: { operatorOrder: ids } });
        } catch {
          messagePopup.getState().error('Errore durante il salvataggio');
        }
      })();
    },
    [updatePreferences],
  );

  return { orderedOperators, orderedIds, setOrder };
}
