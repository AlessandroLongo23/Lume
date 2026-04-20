'use client';

import { useEffect, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

const DEBOUNCE_MS = 300;

export function useRealtimeStore(table: string, onUpdate: () => void, salonId?: string | null) {
  const instanceId = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const base = salonId ? `${table}_changes_${salonId}` : `${table}_changes`;
    const channelName = `${base}_${instanceId}`;
    const filter = salonId
      ? { event: '*' as const, schema: 'public', table, filter: `salon_id=eq.${salonId}` }
      : { event: '*' as const, schema: 'public', table };

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', filter, () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          onUpdate();
          timerRef.current = null;
        }, DEBOUNCE_MS);
      })
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate, salonId, instanceId]);
}
