'use client';

import { useCallback, useMemo } from 'react';
import type { ColumnDef, OnChangeFn, VisibilityState } from '@tanstack/react-table';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

export interface ColumnMetaInfo {
  id: string;
  label: string;
  lockedInPicker: boolean;
  requiredVisible: boolean;
}

function getColumnId<T>(def: ColumnDef<T>): string | undefined {
  if (def.id) return def.id;
  const accessorKey = (def as { accessorKey?: string | number }).accessorKey;
  if (accessorKey != null) return String(accessorKey);
  return undefined;
}

export function describeColumns<T>(columns: ColumnDef<T>[]): ColumnMetaInfo[] {
  const out: ColumnMetaInfo[] = [];
  for (const def of columns) {
    const id = getColumnId(def);
    if (!id) continue;
    const meta = (def.meta ?? {}) as { pickerLabel?: string; lockedInPicker?: boolean; requiredVisible?: boolean };
    const label =
      meta.pickerLabel ??
      (typeof def.header === 'string' ? def.header : '') ??
      id;
    out.push({
      id,
      label: label || id,
      lockedInPicker: meta.lockedInPicker === true,
      requiredVisible: meta.requiredVisible === true,
    });
  }
  return out;
}

interface ResolvedTableColumnPrefs {
  columns: ColumnMetaInfo[];
  columnVisibility: VisibilityState;
  columnOrder: string[];
  setColumnVisibility: OnChangeFn<VisibilityState>;
  setColumnOrder: OnChangeFn<string[]>;
  resetToDefault: () => void;
}

export function useTableColumnPrefs<T>(
  tableId: string,
  columns: ColumnDef<T>[],
): ResolvedTableColumnPrefs {
  const pref = usePreferencesStore((s) => s.preferences.tableColumns?.[tableId]);
  const updatePreferences = usePreferencesStore((s) => s.updatePreferences);

  const meta = useMemo(() => describeColumns(columns), [columns]);

  const { columnOrder, columnVisibility } = useMemo(() => {
    const known = new Map(meta.map((c) => [c.id, c]));
    const seen = new Set<string>();
    const order: string[] = [];

    for (const id of pref?.order ?? []) {
      if (known.has(id) && !seen.has(id)) {
        order.push(id);
        seen.add(id);
      }
    }
    for (const c of meta) {
      if (!seen.has(c.id)) order.push(c.id);
    }

    const visibility: VisibilityState = {};
    const hiddenSet = new Set(pref?.hidden ?? []);
    for (const c of meta) {
      if (c.requiredVisible) continue;
      if (c.lockedInPicker) continue;
      if (hiddenSet.has(c.id)) visibility[c.id] = false;
    }

    return { columnOrder: order, columnVisibility: visibility };
  }, [meta, pref]);

  const persist = useCallback(
    async (nextOrder: string[], nextHidden: string[]) => {
      try {
        await updatePreferences({
          tableColumns: { [tableId]: { order: nextOrder, hidden: nextHidden } },
        });
      } catch {
        messagePopup.getState().error('Errore durante il salvataggio');
      }
    },
    [tableId, updatePreferences],
  );

  const setColumnVisibility: OnChangeFn<VisibilityState> = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(columnVisibility) : updater;
      const nextHidden = meta
        .filter((c) => !c.requiredVisible && !c.lockedInPicker && next[c.id] === false)
        .map((c) => c.id);
      void persist(columnOrder, nextHidden);
    },
    [columnVisibility, columnOrder, meta, persist],
  );

  const setColumnOrder: OnChangeFn<string[]> = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(columnOrder) : updater;
      const currentHidden = meta
        .filter((c) => !c.requiredVisible && !c.lockedInPicker && columnVisibility[c.id] === false)
        .map((c) => c.id);
      void persist(next, currentHidden);
    },
    [columnOrder, columnVisibility, meta, persist],
  );

  const resetToDefault = useCallback(() => {
    void persist([], []);
  }, [persist]);

  return {
    columns: meta,
    columnVisibility,
    columnOrder,
    setColumnVisibility,
    setColumnOrder,
    resetToDefault,
  };
}
