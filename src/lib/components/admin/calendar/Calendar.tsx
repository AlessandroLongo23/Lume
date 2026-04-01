'use client';

import { useState } from 'react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { CalendarToolbar } from './CalendarToolbar';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { AddFicheModal } from './AddFicheModal';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';

export function Calendar() {
  const { currentView, selectedDate, currentMonth, selectedOperatorId } = useCalendarStore();
  const { setSelectedDate, setView } = useCalendarStore();

  // Modal state is transient UI — stays in local state
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
        <CalendarToolbar />

        {currentView === 'day' && (
          <DayView
            selectedDate={selectedDate}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
          />
        )}

        {currentView === 'week' && selectedOperatorId && (
          <WeekView
            selectedDate={selectedDate}
            selectedOperatorId={selectedOperatorId}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
          />
        )}

        {currentView === 'month' && (
          <MonthView
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />
        )}
      </div>
    </>
  );
}
