'use client';

import { useCallback, useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { getWeekDays, formatDateString } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useFichesStore } from '@/lib/stores/fiches';
import { useCalendarStore } from '@/lib/stores/calendar';
import { TimeGrid } from './TimeGrid';
import { DayViewSlot } from './DayViewSlot';
import type { TimeGridColumn } from './TimeGrid';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { isSlotActive, extendBoundsForRanges } from '@/lib/utils/operating-hours';

interface WeekViewProps {
  selectedDate: Date;
  selectedOperatorId: string;
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
  onCreateUnavailability?: (data: { operator: Operator; start: Date; end: Date }) => void;
  onSelectUnavailability?: (item: OperatorUnavailability) => void;
  /** Resolves the effective weekly schedule for one operator. */
  getScheduleFor: (operatorId: string) => DaySchedule[];
  gridBounds: { startHour: number; endHour: number };
}

export function WeekView({ selectedDate, selectedOperatorId, onSlotSelected, onFicheSelected, onCreateUnavailability, onSelectUnavailability, getScheduleFor, gridBounds }: WeekViewProps) {
  const operators = useOperatorsStore((s) => s.operators);
  const fiches = useFichesStore((s) => s.fiches);
  const setHoveredTime = useCalendarStore((s) => s.setHoveredTime);

  const operator = useMemo(
    () => operators.find((op) => op.id === selectedOperatorId) ?? null,
    [operators, selectedOperatorId]
  );

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  const columns: TimeGridColumn[] = useMemo(
    () => weekDays.map((day) => ({
      key: day.toISOString(),
      label: capitalize(formatDateString(day, 'EEE d')),
    })),
    [weekDays]
  );

  // All fiches for this operator within the week
  const weekFiches = useMemo(
    () => fiches.filter((fiche) => {
      const ficheDate = new Date(fiche.datetime);
      return weekDays.some((day) => isSameDay(ficheDate, day));
    }),
    [fiches, weekDays]
  );

  // Pre-group fiches by day ISO string for fast lookup
  const fichesByDay = useMemo(() => {
    const map = new Map<string, typeof weekFiches>();
    for (const day of weekDays) {
      const key = day.toISOString();
      map.set(key, weekFiches.filter((f) => isSameDay(new Date(f.datetime), day)));
    }
    return map;
  }, [weekFiches, weekDays]);

  // Extend grid across the week so any out-of-hours fiche is fully visible.
  const displayBounds = useMemo(() => {
    const ranges = weekFiches.flatMap((fiche) =>
      fiche.getFicheServices().map((fs) => ({
        start: new Date(fs.start_time),
        end: new Date(fs.end_time),
      })),
    );
    return extendBoundsForRanges(gridBounds, ranges);
  }, [weekFiches, gridBounds]);

  const handleCellHover = useCallback(
    (columnKey: string, timeSlot: Date) => {
      const columnDate = new Date(columnKey);
      const date = new Date(columnDate);
      date.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
      setHoveredTime({
        date,
        minutes: timeSlot.getHours() * 60 + timeSlot.getMinutes(),
        operatorId: selectedOperatorId,
      });
    },
    [selectedOperatorId, setHoveredTime],
  );

  if (!operator) return null;

  function renderSlot(columnKey: string, timeSlot: Date) {
    if (!operator) return null;
    const dayFiches = fichesByDay.get(columnKey) ?? [];
    // Adjust the timeSlot to match the column's date
    const columnDate = new Date(columnKey);
    const adjustedSlot = new Date(columnDate);
    adjustedSlot.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);

    const slotMinutes = timeSlot.getHours() * 60 + timeSlot.getMinutes();
    const disabled = !isSlotActive(getScheduleFor(selectedOperatorId), columnDate.getDay(), slotMinutes);
    const slotHour = timeSlot.getHours();
    const extended = slotHour < gridBounds.startHour || slotHour >= gridBounds.endHour;

    return (
      <DayViewSlot
        operator={operator}
        datetime={adjustedSlot}
        fiches={dayFiches}
        onSlotSelected={onSlotSelected}
        onFicheSelected={onFicheSelected}
        onCreateUnavailability={onCreateUnavailability}
        onSelectUnavailability={onSelectUnavailability}
        isDisabled={disabled}
        isExtendedHours={extended}
        gridStartHour={displayBounds.startHour}
        gridEndHour={displayBounds.endHour}
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
      onCellHover={handleCellHover}
    />
  );
}
