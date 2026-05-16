'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { AvailableSlot } from '@/lib/booking/publicTypes';

// Slots arrive at slot_granularity_min steps so a busy day can be ~50 chips
// for an 8-hour shift. We dedupe by start_at when allow_operator_choice is
// false / "any" — the oracle emits one row per eligible operator, but the
// public picker only cares whether *some* operator is free at that time.
function dedupeByStart(slots: AvailableSlot[]): AvailableSlot[] {
  const seen = new Set<string>();
  const out: AvailableSlot[] = [];
  for (const s of slots) {
    if (seen.has(s.start_at)) continue;
    seen.add(s.start_at);
    out.push(s);
  }
  return out;
}

export function TimeSlotPicker({
  salonId,
  serviceId,
  operatorId,
  day,
  onSelect,
}: {
  salonId: string;
  serviceId: string;
  /** null = "any operator" — server picks first eligible. */
  operatorId: string | null;
  day: Date;
  onSelect: (slot: AvailableSlot) => void;
}) {
  const [slots, setSlots] = useState<AvailableSlot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dayISO = useMemo(() => format(day, 'yyyy-MM-dd'), [day]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset spinner + error on every day/operator change; refetch is the whole point of this effect.
    setLoading(true);
    setError(null);
    supabase
      .rpc('get_available_slots', {
        p_salon_id: salonId,
        p_service_id: serviceId,
        p_operator_id: operatorId,
        p_day: dayISO,
      })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Impossibile caricare gli orari.');
          setSlots([]);
        } else {
          const all = (data ?? []) as AvailableSlot[];
          setSlots(operatorId ? all : dedupeByStart(all));
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [salonId, serviceId, operatorId, dayISO]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-[var(--lume-text-muted)]" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-[var(--lume-danger-fg)]">{error}</p>;
  }

  if (!slots || slots.length === 0) {
    return (
      <p className="text-sm text-[var(--lume-text-secondary)]">
        Nessun orario disponibile per questa data. Prova con un altro giorno.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {slots.map((slot) => (
        <button
          key={slot.start_at}
          type="button"
          onClick={() => onSelect(slot)}
          className="rounded-lg border border-[var(--lume-border)] bg-[var(--lume-surface-raised)] py-2 text-sm font-medium text-[var(--lume-text)] hover:border-[var(--lume-accent)] hover:bg-[var(--lume-accent-muted)] hover:text-[var(--lume-accent)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
        >
          {format(new Date(slot.start_at), 'HH:mm')}
        </button>
      ))}
    </div>
  );
}
