import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { FicheStatus } from '@/lib/types/ficheStatus';

// One lookup per salon per page load: the year of its oldest completed fiche.
const firstYearBySalon = new Map<string, Promise<number | null>>();

function firstFicheYear(salonKey: string): Promise<number | null> {
  let pending = firstYearBySalon.get(salonKey);
  if (!pending) {
    pending = Promise.resolve(
      supabase
        .from('fiches')
        .select('datetime')
        .eq('status', FicheStatus.COMPLETED)
        .order('datetime', { ascending: true })
        .limit(1),
    ).then(({ data, error }) => {
      if (error) {
        firstYearBySalon.delete(salonKey); // retry on the next mount
        return null;
      }
      const first = data?.[0]?.datetime;
      return first ? new Date(first).getFullYear() : null;
    });
    firstYearBySalon.set(salonKey, pending);
  }
  return pending;
}

/**
 * Calendar years the salon has history for, newest first, from `newest` back to the
 * year of its oldest completed fiche. Empty until the lookup lands, and when the
 * salon has nothing that old.
 */
export function usePastYears(newest: number): number[] {
  const salonId = useWorkspaceStore((s) => s.activeSalonId);
  const [firstYear, setFirstYear] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void firstFicheYear(salonId ?? '').then((year) => {
      if (!cancelled) setFirstYear(year);
    });
    return () => {
      cancelled = true;
    };
  }, [salonId]);

  if (firstYear === null || firstYear > newest) return [];
  return Array.from({ length: newest - firstYear + 1 }, (_, i) => newest - i);
}
