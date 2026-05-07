'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { addMonths, subMonths, formatDateString, getWeekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { startOfMonth } from 'date-fns';
import { useCalendarStore } from '@/lib/stores/calendar';
import { Button } from '@/lib/components/shared/ui/Button';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { CalendarDatePicker } from './CalendarDatePicker';
import { OperatorChips } from './OperatorChips';
import { HoveredTimePreview } from './CalendarHeader';
import type { Operator } from '@/lib/types/Operator';

const VIEW_VALUES = ['day', 'week', 'month'] as const;
const VIEW_LABELS = ['Giorno', 'Settimana', 'Mese'];

type CalendarView = (typeof VIEW_VALUES)[number];

interface CalendarToolbarProps {
  onAddFerie?: (operator: Operator) => void;
}

export function CalendarToolbar({ onAddFerie }: CalendarToolbarProps = {}) {
  const { currentView, selectedDate, currentMonth } = useCalendarStore();
  const { setView, setSelectedDate, setCurrentMonth } = useCalendarStore();

  function navigatePrev() {
    if (currentView === 'day') setSelectedDate(subDays(selectedDate, 1));
    else if (currentView === 'week') setSelectedDate(subDays(selectedDate, 7));
    else setCurrentMonth(subMonths(currentMonth, 1));
  }

  function navigateNext() {
    if (currentView === 'day') setSelectedDate(addDays(selectedDate, 1));
    else if (currentView === 'week') setSelectedDate(addDays(selectedDate, 7));
    else setCurrentMonth(addMonths(currentMonth, 1));
  }

  function goToToday() {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  }

  function getDateLabel(): string {
    if (currentView === 'day') {
      return capitalize(formatDateString(selectedDate, 'EEEE, d MMMM yyyy'));
    }
    if (currentView === 'week') {
      const days = getWeekDays(selectedDate);
      const start = days[0];
      const end = days[6];
      return `${capitalize(formatDateString(start, 'd MMM'))} — ${capitalize(formatDateString(end, 'd MMM yyyy'))}`;
    }
    return capitalize(formatDateString(currentMonth, 'MMMM yyyy'));
  }

  function handleViewChange(view: CalendarView) {
    setView(view);
  }

  return (
    <div className="flex w-full justify-between items-center gap-6 py-3 mb-3 border-b border-zinc-500/25">

      {/* Left: live hover-time preview */}
      <div className="flex items-center min-w-0 basis-0 grow shrink">
        <HoveredTimePreview />
      </div>

      {/* Center: prev / date (click = today) / next */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" iconOnly aria-label="Precedente" onClick={navigatePrev}>
          <ChevronLeft />
        </Button>

        {/* Date label opens a dropdown to pick year / month / day */}
        <CalendarDatePicker
          label={getDateLabel()}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          monthOnly={currentView === 'month'}
          onSelect={(date) => {
            if (currentView === 'month') {
              setCurrentMonth(startOfMonth(date));
            } else {
              setSelectedDate(date);
              setCurrentMonth(date);
            }
          }}
          onGoToToday={goToToday}
        />

        <Button variant="ghost" size="sm" iconOnly aria-label="Successivo" onClick={navigateNext}>
          <ChevronRight />
        </Button>
      </div>

      {/* Right: operator chips + view toggle */}
      <div className="flex items-center justify-end gap-3 min-w-0 basis-0 grow shrink">
        <div className="min-w-0 flex">
          <OperatorChips onAddFerie={onAddFerie} />
        </div>

        <ToggleButton
          options={[...VIEW_VALUES]}
          value={currentView}
          onChange={(v) => handleViewChange(v as CalendarView)}
          labels={VIEW_LABELS}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
