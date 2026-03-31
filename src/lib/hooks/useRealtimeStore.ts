'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useRealtimeStore(table: string, onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => { onUpdate(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate]);
}
