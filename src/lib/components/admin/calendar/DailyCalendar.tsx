'use client';

import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useFichesStore } from '@/lib/stores/fiches';
import { generateTimeSlots, formatTimeSlot } from '@/lib/utils/calendar-config';
import { DailyCalendarSlot } from './DailyCalendarSlot';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';

interface DailyCalendarProps {
  selectedDate: Date;
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
}

export function DailyCalendar({ selectedDate, onSlotSelected, onFicheSelected }: DailyCalendarProps) {
  const operators = useOperatorsStore((s) => s.operators);
  const fiches = useFichesStore((s) => s.fiches);

  const timeSlots = useMemo(() => generateTimeSlots(new Date(selectedDate)), [selectedDate]);

  const dateFiches = useMemo(() =>
    fiches.filter((fiche) => isSameDay(new Date(fiche.datetime), new Date(selectedDate))),
    [fiches, selectedDate]
  );

  return (
    <div className="flex flex-col border border-zinc-500/25 rounded-lg overflow-hidden">
      <div className="grid bg-zinc-100 dark:bg-zinc-800" style={{ gridTemplateColumns: '80px 1fr' }}>
        <div className="p-2 font-medium border-r border-zinc-500/25 text-center">Orario</div>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${operators.length}, minmax(0, 1fr))` }}>
          {operators.map((op) => (
            <div key={op.id} className="p-2 font-medium text-center border-r border-zinc-500/25 last:border-r-0">
              {op.getFullName()}
            </div>
          ))}
        </div>
      </div>

      {timeSlots.map((timeSlot, i) => (
        <div key={i} className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
          <div className="border-r border-zinc-500/25">
            <div className={`p-2 h-8 text-xs border-t flex items-center justify-center ${timeSlot.getMinutes() === 0 ? 'border-zinc-500/50' : 'border-zinc-500/25'}`}>
              {formatTimeSlot(timeSlot)}
            </div>
          </div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${operators.length}, minmax(0, 1fr))` }}>
            {operators.map((op) => (
              <DailyCalendarSlot
                key={op.id}
                operator={op}
                datetime={timeSlot}
                fiches={dateFiches}
                onSlotSelected={onSlotSelected}
                onFicheSelected={onFicheSelected}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
