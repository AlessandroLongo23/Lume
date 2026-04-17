'use client';

import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useFichesStore } from '@/lib/stores/fiches';
import { useCalendarStore } from '@/lib/stores/calendar';
import { TimeGrid } from './TimeGrid';
import { DayViewSlot } from './DayViewSlot';
import type { TimeGridColumn } from './TimeGrid';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { isSlotActive, extendBoundsForRanges } from '@/lib/utils/operating-hours';

interface DayViewProps {
  selectedDate: Date;
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
  operatingHours: DaySchedule[];
  gridBounds: { startHour: number; endHour: number };
}

export function DayView({ selectedDate, onSlotSelected, onFicheSelected, operatingHours, gridBounds }: DayViewProps) {
  const operators = useOperatorsStore((s) => s.operators);
  const fiches = useFichesStore((s) => s.fiches);
  const selectedOperatorId = useCalendarStore((s) => s.selectedOperatorId);

  const activeOperators = useMemo(() => {
    const base = operators.filter((op) => !op.isArchived);
    return selectedOperatorId ? base.filter((op) => op.id === selectedOperatorId) : base;
  }, [operators, selectedOperatorId]);

  const columns: TimeGridColumn[] = useMemo(
    () => activeOperators.map((op) => ({ key: op.id, label: op.getFullName() })),
    [activeOperators]
  );

  const dateFiches = useMemo(
    () => fiches.filter((fiche) => isSameDay(new Date(fiche.datetime), new Date(selectedDate))),
    [fiches, selectedDate]
  );

  // Extend grid so any out-of-hours fiche for this day is fully visible.
  const displayBounds = useMemo(() => {
    const ranges = dateFiches.flatMap((fiche) =>
      fiche.getFicheServices().map((fs) => ({
        start: new Date(fs.start_time),
        end: new Date(fs.end_time),
      })),
    );
    return extendBoundsForRanges(gridBounds, ranges);
  }, [dateFiches, gridBounds]);

  // Build an operator lookup for the slot renderer
  const operatorMap = useMemo(
    () => new Map(activeOperators.map((op) => [op.id, op])),
    [activeOperators]
  );

  function renderSlot(columnKey: string, timeSlot: Date) {
    const operator = operatorMap.get(columnKey);
    if (!operator) return null;
    const slotMinutes = timeSlot.getHours() * 60 + timeSlot.getMinutes();
    const disabled = !isSlotActive(operatingHours, timeSlot.getDay(), slotMinutes);
    const slotHour = timeSlot.getHours();
    const extended = slotHour < gridBounds.startHour || slotHour >= gridBounds.endHour;
    return (
      <DayViewSlot
        operator={operator}
        datetime={timeSlot}
        fiches={dateFiches}
        onSlotSelected={onSlotSelected}
        onFicheSelected={onFicheSelected}
        isDisabled={disabled}
        isExtendedHours={extended}
      />
    );
  }

  return (
    <TimeGrid
      columns={columns}
      date={selectedDate}
      renderSlot={renderSlot}
      startHour={displayBounds.startHour}
      endHour={displayBounds.endHour}
      scheduleBounds={gridBounds}
    />
  );
}
