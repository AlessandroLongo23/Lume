'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { addMonths, subMonths, formatDateString, getWeekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { startOfMonth } from 'date-fns';
import { useCalendarStore } from '@/lib/stores/calendar';
import { Button } from '@/lib/components/shared/ui/Button';
import { CalendarDatePicker } from './CalendarDatePicker';
import { OperatorChips } from './OperatorChips';
import { HoveredTimePreview } from './CalendarHeader';
import type { Operator } from '@/lib/types/Operator';

const VIEW_OPTIONS = [
  { value: 'day', label: 'Giorno' },
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
] as const;

type CalendarView = 'day' | 'week' | 'month';

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

        <div
          role="radiogroup"
          className="flex flex-row items-center rounded-lg overflow-hidden border border-zinc-500/25 shrink-0"
        >
          {VIEW_OPTIONS.map(({ value, label }, i) => {
            const isActive = currentView === value;

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => handleViewChange(value)}
                className={[
                  'flex items-center justify-center px-3 py-2 text-sm transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:z-content-floating',
                  i > 0 ? 'border-l border-zinc-500/25' : '',
                  isActive
                    ? 'bg-primary/10 text-primary-hover dark:text-primary/70'
                    : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
