'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { UnavailabilityModal } from './UnavailabilityModal';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { useUnavailabilityCreateStore } from '@/lib/stores/unavailabilityCreate';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';
import { useCalendarDrag, type DropResult } from '@/lib/hooks/useCalendarDrag';
import {
  buildAppointmentChangeMessage,
  buildAppointmentWhatsAppLink,
  sendAppointmentChangeEmail,
} from '@/lib/utils/calendar-notify';
import type { Operator } from '@/lib/types/Operator';
import type { Fiche } from '@/lib/types/Fiche';
import type { DaySchedule } from '@/lib/utils/operating-hours';
import { effectiveScheduleFor, getGridBounds } from '@/lib/utils/operating-hours';

const PIXELS_PER_SLOT = 32; // h-8 in CSS

export function Calendar() {
  const { currentView, selectedDate, currentMonth, focusedOperatorId } = useCalendarStore();
  const { setSelectedDate, setView, setHoveredTime } = useCalendarStore();
  const applyPlannedSegments = useFicheServicesStore((s) => s.applyPlannedSegments);
  const operators = useOperatorsStore((s) => s.operators);
  const salonSettings = useSalonSettingsStore((s) => s.settings);

  // Clear the hover-time preview whenever the view changes — stale values would
  // otherwise linger in the header until the user hovers a fresh cell.
  useEffect(() => {
    setHoveredTime(null);
  }, [currentView, setHoveredTime]);

  // For the week view: fall back to the first active operator when none is explicitly focused.
  const weekOperatorId = useMemo(() => {
    if (focusedOperatorId) return focusedOperatorId;
    return operators.find((op) => !op.isArchived)?.id ?? null;
  }, [focusedOperatorId, operators]);
  const timeStep = salonSettings?.slot_granularity_min ?? CALENDAR_CONFIG.daily.timeStep;
  const salonName = salonSettings?.name ?? 'Lume';

  // Salon-wide hours drive the grid bounds. Each operator either inherits these
  // (working_hours = null) or overrides with their own schedule.
  const salonHours = useMemo<DaySchedule[]>(
    () => (Array.isArray(salonSettings?.operating_hours) ? salonSettings!.operating_hours : []),
    [salonSettings],
  );

  const gridBounds = useMemo(() => getGridBounds(salonHours), [salonHours]);

  /** Returns the effective schedule for one operator (custom or salon fallback). */
  const getScheduleFor = useCallback(
    (operatorId: string): DaySchedule[] => {
      const op = operators.find((o) => o.id === operatorId);
      return effectiveScheduleFor(op?.working_hours ?? null, salonHours);
    },
    [operators, salonHours],
  );

  // Modal state — transient UI in local state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOperator, setModalOperator] = useState<Operator | null>(null);
  const [modalDatetime, setModalDatetime] = useState<Date | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFiche, setEditFiche] = useState<Fiche | null>(null);

  // Drag → confirm modal state
  const [pendingDrop, setPendingDrop] = useState<DropResult | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  // Unavailability modal state
  const [isUnavailModalOpen, setIsUnavailModalOpen] = useState(false);
  const [unavailModalOperator, setUnavailModalOperator] = useState<Operator | null>(null);
  const [unavailModalPrefill, setUnavailModalPrefill] = useState<{ start: Date; end: Date } | null>(null);
  const [unavailModalEditing, setUnavailModalEditing] = useState<OperatorUnavailability | null>(null);

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

  function handleCreateUnavailability({ operator, start, end }: { operator: Operator; start: Date; end: Date }) {
    setUnavailModalOperator(operator);
    setUnavailModalPrefill({ start, end });
    setUnavailModalEditing(null);
    setIsUnavailModalOpen(true);
  }

  function handleSelectUnavailability(item: OperatorUnavailability) {
    setUnavailModalOperator(item.getOperator());
    setUnavailModalPrefill(null);
    setUnavailModalEditing(item);
    setIsUnavailModalOpen(true);
  }

  function handleAddFerie(operator: Operator) {
    setUnavailModalOperator(operator);
    setUnavailModalPrefill(null);
    setUnavailModalEditing(null);
    setIsUnavailModalOpen(true);
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
    getSchedule: getScheduleFor,
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

      <UnavailabilityModal
        isOpen={isUnavailModalOpen}
        onClose={() => {
          setIsUnavailModalOpen(false);
          setUnavailModalPrefill(null);
          setUnavailModalEditing(null);
          useUnavailabilityCreateStore.getState().end();
        }}
        operator={unavailModalOperator}
        prefill={unavailModalPrefill}
        editing={unavailModalEditing}
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

      <div className="relative flex-1 min-h-0 flex flex-col">
        <CalendarToolbar onAddFerie={handleAddFerie} />

        {currentView === 'day' && (
          <DayView
            selectedDate={selectedDate}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
            onCreateUnavailability={handleCreateUnavailability}
            onSelectUnavailability={handleSelectUnavailability}
            getScheduleFor={getScheduleFor}
            gridBounds={gridBounds}
          />
        )}

        {currentView === 'week' && weekOperatorId && (
          <WeekView
            selectedDate={selectedDate}
            selectedOperatorId={weekOperatorId}
            onSlotSelected={handleSlotSelected}
            onFicheSelected={handleFicheSelected}
            onCreateUnavailability={handleCreateUnavailability}
            onSelectUnavailability={handleSelectUnavailability}
            getScheduleFor={getScheduleFor}
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
