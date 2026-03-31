'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths } from '@/lib/utils/date';
import { formatDateString } from '@/lib/utils/date';
import { capitalize } from '@/lib/utils/string';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { CalendarIcon } from '@/lib/components/shared/ui/CalendarIcon';
import { MonthlyCalendar } from './MonthlyCalendar';
import { DailyCalendar } from './DailyCalendar';
import { AddFicheModal } from './AddFicheModal';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';

export function Calendar() {
  const [view, setView] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOperator, setModalOperator] = useState<Operator | null>(null);
  const [modalDatetime, setModalDatetime] = useState<Date | undefined>(undefined);

  function handleDayClick(day: Date) {
    setSelectedDate(day);
    setView('day');
  }

  function handleSlotSelected({ operator, datetime }: { operator: Operator; datetime: Date }) {
    setModalOperator(operator);
    setModalDatetime(datetime);
    setIsModalOpen(true);
  }

  function handleFicheSelected(_fiche: Fiche) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // TODO: open edit fiche modal
  }

  return (
    <>
      <AddFicheModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        datetime={modalDatetime}
        operator={modalOperator}
      />

      <div className="relative h-full flex flex-col">
        <div className="flex w-full justify-between items-center py-4 mb-4 pb-4 border-b border-zinc-500/25">
          {view === 'day' && <CalendarIcon date={selectedDate} />}
          {view === 'month' && (
            <div className="flex flex-row gap-4 items-center">
              <div className="flex flex-row justify-between items-center border border-zinc-500/25 rounded-md w-54">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-l-md"
                  aria-label="Mese precedente"
                  type="button"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  type="button"
                >
                  {capitalize(formatDateString(currentMonth, 'MMMM yyyy'))}
                </button>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-r-md"
                  aria-label="Mese successivo"
                  type="button"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          <ToggleButton
            value={view}
            onChange={(v) => setView(v)}
            options={['day', 'month']}
            labels={['Giorno', 'Mese']}
          />
        </div>

        {view === 'day' && (
          <DailyCalendar
            selectedDate={selectedDate}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
          />
        )}
        {view === 'month' && (
          <MonthlyCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </>
  );
}
