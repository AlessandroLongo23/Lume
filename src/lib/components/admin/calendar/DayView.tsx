'use client';

import { useCallback, useMemo } from 'react';
import { isSameDay } from 'date-fns';
import { useFichesStore } from '@/lib/stores/fiches';
import { useCalendarStore } from '@/lib/stores/calendar';
import { useOperatorOrder } from '@/lib/hooks/useOperatorOrder';
import { TimeGrid } from './TimeGrid';
import { DayViewSlot } from './DayViewSlot';
import { OperatorAvatar } from './OperatorFilterButton';
import type { TimeGridColumn } from './TimeGrid';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { isSlotActive, extendBoundsForRanges } from '@/lib/utils/operating-hours';

interface DayViewProps {
  selectedDate: Date;
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
  onCreateUnavailability?: (data: { operator: Operator; start: Date; end: Date }) => void;
  onSelectUnavailability?: (item: OperatorUnavailability) => void;
  /** Resolves the effective weekly schedule for one operator. */
  getScheduleFor: (operatorId: string) => DaySchedule[];
  gridBounds: { startHour: number; endHour: number };
}

export function DayView({ selectedDate, onSlotSelected, onFicheSelected, onCreateUnavailability, onSelectUnavailability, getScheduleFor, gridBounds }: DayViewProps) {
  const { orderedOperators } = useOperatorOrder();
  const fiches = useFichesStore((s) => s.fiches);
  const selectedOperatorIds = useCalendarStore((s) => s.selectedOperatorIds);
  const setHoveredTime = useCalendarStore((s) => s.setHoveredTime);

  const activeOperators = useMemo(() => {
    if (selectedOperatorIds === null) return orderedOperators;
    const set = new Set(selectedOperatorIds);
    return orderedOperators.filter((op) => set.has(op.id));
  }, [orderedOperators, selectedOperatorIds]);

  const columns: TimeGridColumn[] = useMemo(
    () =>
      activeOperators.map((op) => ({
        key: op.id,
        label: op.getFullName(),
        header: (
          <span className="flex items-center gap-2 min-w-0">
            <OperatorAvatar operator={op} size={24} />
            <span className="truncate sm:hidden">{op.firstName || op.getFullName()}</span>
            <span className="truncate hidden sm:inline">{op.getFullName()}</span>
          </span>
        ),
      })),
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

  const handleCellHover = useCallback(
    (columnKey: string, timeSlot: Date) => {
      const date = new Date(selectedDate);
      date.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
      setHoveredTime({
        date,
        minutes: timeSlot.getHours() * 60 + timeSlot.getMinutes(),
        operatorId: columnKey,
      });
    },
    [selectedDate, setHoveredTime],
  );

  function renderSlot(columnKey: string, timeSlot: Date) {
    const operator = operatorMap.get(columnKey);
    if (!operator) return null;
    const slotMinutes = timeSlot.getHours() * 60 + timeSlot.getMinutes();
    const disabled = !isSlotActive(getScheduleFor(operator.id), timeSlot.getDay(), slotMinutes);
    const slotHour = timeSlot.getHours();
    const extended = slotHour < gridBounds.startHour || slotHour >= gridBounds.endHour;
    return (
      <DayViewSlot
        operator={operator}
        datetime={timeSlot}
        fiches={dateFiches}
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

  if (activeOperators.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-sm text-[var(--lume-text-secondary)]">
        Nessun operatore selezionato.
      </div>
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
