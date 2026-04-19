'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { addMonths, subMonths, formatDateString, getWeekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { startOfMonth } from 'date-fns';
import { useCalendarStore } from '@/lib/stores/calendar';
import { useOperatorsStore } from '@/lib/stores/operators';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CalendarDatePicker } from './CalendarDatePicker';

const VIEW_OPTIONS = [
  { value: 'day', label: 'Giorno' },
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
] as const;

type CalendarView = 'day' | 'week' | 'month';

export function CalendarToolbar() {
  const { currentView, selectedDate, currentMonth, selectedOperatorId } = useCalendarStore();
  const { setView, setSelectedDate, setCurrentMonth, setSelectedOperatorId } = useCalendarStore();
  const operators = useOperatorsStore((s) => s.operators);

  const activeOperators = operators.filter((op) => !op.isArchived);
  const weekDisabled = !selectedOperatorId;

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
    if (view === 'week' && weekDisabled) return;
    setView(view);
  }

  return (
    <div className="flex w-full justify-between items-center py-4 mb-4 pb-4 border-b border-zinc-500/25">

      {/* Left: operator filter */}
      <div className="flex items-center">
        <CustomSelect
          value={selectedOperatorId}
          onChange={setSelectedOperatorId}
          options={activeOperators}
          labelKey={(op) => op.getFullName()}
          valueKey="id"
          placeholder="Tutti gli operatori"
          isNullable
          searchable={false}
          width="w-52"
        />
      </div>

      {/* Center: prev / date (click = today) / next */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={navigatePrev}
          aria-label="Precedente"
          className="p-2 rounded-md text-zinc-500 dark:text-zinc-400
            hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

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

        <button
          type="button"
          onClick={navigateNext}
          aria-label="Successivo"
          className="p-2 rounded-md text-zinc-500 dark:text-zinc-400
            hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right: view toggle */}
      <div className="flex items-center gap-3">

        {/* View toggle — Settimana is disabled without a selected operator */}
        <div
          role="radiogroup"
          className="flex flex-row items-center rounded-lg overflow-hidden border border-zinc-500/25"
        >
          {VIEW_OPTIONS.map(({ value, label }, i) => {
            const isActive = currentView === value;
            const isDisabled = value === 'week' && weekDisabled;

            const button = (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                disabled={isDisabled}
                onClick={() => handleViewChange(value)}
                className={[
                  'flex items-center justify-center px-3 py-2 text-sm transition-all',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:z-10',
                  i > 0 ? 'border-l border-zinc-500/25' : '',
                  isDisabled
                    ? 'cursor-not-allowed opacity-40 bg-white dark:bg-zinc-800 text-zinc-400'
                    : isActive
                      ? 'bg-primary/10 text-primary-hover dark:text-primary/70'
                      : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700',
                ].join(' ')}
              >
                {label}
              </button>
            );

            if (!isDisabled) return button;

            // Wrap disabled Settimana in a Tailwind tooltip
            return (
              <span key={value} className="relative group">
                {button}
                <span
                  role="tooltip"
                  className={[
                    'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
                    'w-64 rounded-md px-3 py-2 text-xs text-white bg-zinc-800 dark:bg-zinc-700 shadow-lg',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                    'whitespace-normal text-center',
                  ].join(' ')}
                >
                  Seleziona un singolo operatore per attivare la vista settimanale
                  {/* arrow */}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
