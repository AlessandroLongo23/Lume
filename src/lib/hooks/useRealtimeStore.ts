'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

const DEBOUNCE_MS = 300;

export function useRealtimeStore(table: string, onUpdate: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            onUpdate();
            timerRef.current = null;
          }, DEBOUNCE_MS);
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate]);
}
