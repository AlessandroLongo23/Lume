'use client';

import { useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useFichesStore } from '@/lib/stores/fiches';
import { TimeGrid } from './TimeGrid';
import { DayViewSlot } from './DayViewSlot';
import type { TimeGridColumn } from './TimeGrid';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { isSlotActive } from '@/lib/utils/operating-hours';

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

  const activeOperators = operators.filter((op) => !op.isArchived);

  const columns: TimeGridColumn[] = useMemo(
    () => activeOperators.map((op) => ({ key: op.id, label: op.getFullName() })),
    [activeOperators]
  );

  const dateFiches = useMemo(
    () => fiches.filter((fiche) => isSameDay(new Date(fiche.datetime), new Date(selectedDate))),
    [fiches, selectedDate]
  );

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
    return (
      <DayViewSlot
        operator={operator}
        datetime={timeSlot}
        fiches={dateFiches}
        onSlotSelected={onSlotSelected}
        onFicheSelected={onFicheSelected}
        isDisabled={disabled}
      />
    );
  }

  return (
    <TimeGrid
      columns={columns}
      date={selectedDate}
      renderSlot={renderSlot}
      startHour={gridBounds.startHour}
      endHour={gridBounds.endHour}
    />
  );
}
