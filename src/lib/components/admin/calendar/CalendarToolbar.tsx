'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { addMonths, subMonths, formatDateString, getWeekDays } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { useCalendarStore } from '@/lib/stores/calendar';
import { useOperatorsStore } from '@/lib/stores/operators';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { CalendarIcon } from '@/lib/components/shared/ui/CalendarIcon';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';

export function CalendarToolbar() {
  const { currentView, selectedDate, currentMonth, selectedOperatorId } = useCalendarStore();
  const { setView, setSelectedDate, setCurrentMonth, setSelectedOperatorId } = useCalendarStore();
  const operators = useOperatorsStore((s) => s.operators);

  const activeOperators = operators.filter((op) => !op.isArchived);

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

  function handleViewChange(view: 'day' | 'week' | 'month') {
    setView(view);
  }

  function handleOperatorChange(id: string | null) {
    setSelectedOperatorId(id);
  }

  return (
    <div className="flex w-full justify-between items-center py-4 mb-4 pb-4 border-b border-zinc-500/25">
      {/* Left: date context */}
      <div className="flex items-center gap-3">
        {currentView === 'day' && <CalendarIcon date={selectedDate} />}

        {currentView === 'week' && (() => {
          const weekDays = getWeekDays(selectedDate);
          const start = weekDays[0];
          const end = weekDays[6];
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-zinc-500/25 rounded-md">
                <button
                  onClick={navigatePrev}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-l-md"
                  aria-label="Settimana precedente"
                  type="button"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  type="button"
                >
                  {capitalize(formatDateString(start, 'd MMM'))} — {capitalize(formatDateString(end, 'd MMM yyyy'))}
                </button>
                <button
                  onClick={navigateNext}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-r-md"
                  aria-label="Settimana successiva"
                  type="button"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          );
        })()}

        {currentView === 'month' && (
          <div className="flex items-center border border-zinc-500/25 rounded-md">
            <button
              onClick={navigatePrev}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-l-md"
              aria-label="Mese precedente"
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              type="button"
            >
              {capitalize(formatDateString(currentMonth, 'MMMM yyyy'))}
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-r-md"
              aria-label="Mese successivo"
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Right: operator filter + view toggle */}
      <div className="flex items-center gap-3">
        <CustomSelect
          value={selectedOperatorId}
          onChange={handleOperatorChange}
          options={activeOperators}
          labelKey={(op) => op.getFullName()}
          valueKey="id"
          placeholder="Tutti gli operatori"
          isNullable
          searchable={false}
          width="w-52"
        />

        <ToggleButton
          value={currentView}
          onChange={handleViewChange}
          options={['day', 'week', 'month']}
          labels={['Giorno', 'Settimana', 'Mese']}
        />
      </div>
    </div>
  );
}
