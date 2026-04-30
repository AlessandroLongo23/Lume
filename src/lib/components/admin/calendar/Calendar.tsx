'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCalendarStore } from '@/lib/stores/calendar';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { CALENDAR_CONFIG } from '@/lib/utils/calendar-config';
import { CalendarToolbar } from './CalendarToolbar';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { CalendarDragGhost } from './CalendarDragGhost';
import { ConfirmAppointmentChangeModal } from './ConfirmAppointmentChangeModal';
import { CalendarDragContext } from './CalendarDragContext';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { useCalendarDrag, type DropResult } from '@/lib/hooks/useCalendarDrag';
import {
  buildAppointmentChangeMessage,
  buildAppointmentWhatsAppLink,
  sendAppointmentChangeEmail,
} from '@/lib/utils/calendar-notify';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { getGridBounds } from '@/lib/utils/operating-hours';

const PIXELS_PER_SLOT = 32; // h-8 in CSS

export function Calendar() {
  const { currentView, selectedDate, currentMonth, selectedOperatorId } = useCalendarStore();
  const { setSelectedDate, setView } = useCalendarStore();
  const applyPlannedSegments = useFicheServicesStore((s) => s.applyPlannedSegments);
  const operators = useOperatorsStore((s) => s.operators);
  const salonSettings = useSalonSettingsStore((s) => s.settings);

  // For the week view: fall back to the first active operator when none is explicitly selected.
  const weekOperatorId = useMemo(() => {
    if (selectedOperatorId) return selectedOperatorId;
    return operators.find((op) => !op.isArchived)?.id ?? null;
  }, [selectedOperatorId, operators]);
  const timeStep = salonSettings?.slot_granularity_min ?? CALENDAR_CONFIG.daily.timeStep;
  const salonName = salonSettings?.name ?? 'Lume';

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

  // Modal state — transient UI in local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOperator, setModalOperator] = useState<Operator | null>(null);
  const [modalDatetime, setModalDatetime] = useState<Date | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFiche, setEditFiche] = useState<Fiche | null>(null);

  // Drag → confirm modal state
  const [pendingDrop, setPendingDrop] = useState<DropResult | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

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

  // ============ Drag orchestration ============
  const handleDrop = useCallback(async (result: DropResult) => {
    // Optimistic apply happens inside applyPlannedSegments — call it first so the UI
    // immediately reflects the drop while the modal asks for notification choice.
    try {
      await applyPlannedSegments(
        result.after.map((seg) => ({
          ficheServiceId: seg.ficheServiceId,
          start: seg.start,
          end: seg.end,
          operatorId: seg.operatorId,
        })),
      );
      setPendingDrop(result);
    } catch (err) {
      console.error('Failed to apply appointment change:', err);
    }
  }, [applyPlannedSegments]);

  const { beginMove, beginResize } = useCalendarDrag({
    schedule: operatingHours,
    pixelsPerSlot: PIXELS_PER_SLOT,
    timeStep,
    onDrop: handleDrop,
  });

  const dragCtx = useMemo(() => ({ beginMove, beginResize }), [beginMove, beginResize]);

  async function handleConfirmChange(notify: { email: boolean; whatsapp: boolean }) {
    if (!pendingDrop) return;
    setIsPersisting(true);
    try {
      const fiche = useFichesStore.getState().fiches.find((f) => f.id === pendingDrop.ficheId);
      const client = fiche?.getClient() ?? null;
      const oldStart = pendingDrop.before.reduce(
        (min, s) => (s.start.getTime() < min.getTime() ? s.start : min),
        pendingDrop.before[0].start,
      );
      const newStart = pendingDrop.after.reduce(
        (min, s) => (s.start.getTime() < min.getTime() ? s.start : min),
        pendingDrop.after[0].start,
      );
      const newEnd = pendingDrop.after.reduce(
        (max, s) => (s.end.getTime() > max.getTime() ? s.end : max),
        pendingDrop.after[0].end,
      );

      if (client && (notify.email || notify.whatsapp)) {
        const message = buildAppointmentChangeMessage({
          client: { firstName: client.firstName },
          oldStart,
          newStart,
          newEnd,
          salonName,
        });

        if (notify.email && client.email) {
          // Fire-and-forget — never blocks the operator's flow.
          sendAppointmentChangeEmail({
            to: client.email,
            firstName: client.firstName,
            oldStart,
            newStart,
            newEnd,
            salonName,
            message,
          }).catch((e) => console.error('Email send failed:', e));
        }

        if (notify.whatsapp && client.hasPhone()) {
          const link = buildAppointmentWhatsAppLink(client, message);
          if (link) window.open(link, '_blank');
        }
      }

      setPendingDrop(null);
    } finally {
      setIsPersisting(false);
    }
  }

  async function handleCancelChange() {
    if (!pendingDrop) return;
    // Roll back the optimistic apply by re-running with the BEFORE segments.
    try {
      await applyPlannedSegments(
        pendingDrop.before.map((seg) => ({
          ficheServiceId: seg.ficheServiceId,
          start: seg.start,
          end: seg.end,
          operatorId: seg.operatorId,
        })),
      );
    } catch (err) {
      console.error('Rollback failed:', err);
    } finally {
      setPendingDrop(null);
    }
  }

  // Resolve client for the modal
  const pendingClient = useMemo(() => {
    if (!pendingDrop) return null;
    const fiche = useFichesStore.getState().fiches.find((f) => f.id === pendingDrop.ficheId);
    return fiche?.getClient() ?? null;
  }, [pendingDrop]);

  return (
    <CalendarDragContext.Provider value={dragCtx}>
      <FicheModal
        mode="add"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        datetime={modalDatetime}
        operator={modalOperator}
      />
      <FicheModal
        mode="edit"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        fiche={editFiche}
      />

      <ConfirmAppointmentChangeModal
        isOpen={!!pendingDrop}
        client={pendingClient}
        before={pendingDrop?.before ?? []}
        after={pendingDrop?.after ?? []}
        onConfirm={handleConfirmChange}
        onCancel={handleCancelChange}
        isSubmitting={isPersisting}
      />

      <CalendarDragGhost pixelsPerSlot={PIXELS_PER_SLOT} timeStep={timeStep} />

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

        {currentView === 'week' && weekOperatorId && (
          <WeekView
            selectedDate={selectedDate}
            selectedOperatorId={weekOperatorId}
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
    </CalendarDragContext.Provider>
  );
}
