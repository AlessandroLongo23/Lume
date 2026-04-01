'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { CalendarToolbar } from './CalendarToolbar';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { AddFicheModal } from './AddFicheModal';
import { EditFicheModal } from './EditFicheModal';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { getGridBounds } from '@/lib/utils/operating-hours';

export function Calendar() {
  const { currentView, selectedDate, currentMonth, selectedOperatorId } = useCalendarStore();
  const { setSelectedDate, setView } = useCalendarStore();

  // Operating hours — fetched once, drives grid bounds and disabled slots
  const [operatingHours, setOperatingHours] = useState<DaySchedule[]>([]);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.operating_hours)) {
          setOperatingHours(data.operating_hours as DaySchedule[]);
        }
      })
      .catch(() => {
        // leave empty → isSlotActive returns true for all slots (safe fallback)
      });
  }, []);

  const gridBounds = useMemo(() => getGridBounds(operatingHours), [operatingHours]);

  // Modal state is transient UI — stays in local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOperator, setModalOperator] = useState<Operator | null>(null);
  const [modalDatetime, setModalDatetime] = useState<Date | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFiche, setEditFiche] = useState<Fiche | null>(null);

  function handleDayClick(day: Date) {
    setSelectedDate(day);
    setView('day');
  }

  function handleSlotSelected({ operator, datetime }: { operator: Operator; datetime: Date }) {
    setModalOperator(operator);
    setModalDatetime(datetime);
    setIsModalOpen(true);
  }

  function handleFicheSelected(fiche: Fiche) {
    setEditFiche(fiche);
    setIsEditModalOpen(true);
  }

  return (
    <>
      <AddFicheModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        datetime={modalDatetime}
        operator={modalOperator}
      />
      <EditFicheModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        fiche={editFiche}
      />

      <div className="relative h-full flex flex-col">
        <CalendarToolbar />

        {currentView === 'day' && (
          <DayView
            selectedDate={selectedDate}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
            operatingHours={operatingHours}
            gridBounds={gridBounds}
          />
        )}

        {currentView === 'week' && selectedOperatorId && (
          <WeekView
            selectedDate={selectedDate}
            selectedOperatorId={selectedOperatorId}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
            operatingHours={operatingHours}
            gridBounds={gridBounds}
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
