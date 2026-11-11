'use client';

import { useRef, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useCalendarDragStore } from '@/lib/stores/calendarDrag';
import { useUnavailabilityCreateStore } from '@/lib/stores/unavailabilityCreate';
import { useOperatorUnavailabilitiesStore } from '@/lib/stores/operatorUnavailabilities';
import { CALENDAR_CONFIG } from '@/lib/utils/calendar-config';
import { remToPx } from '@/lib/utils/uiScale';
import { FicheBlock } from './FicheBlock';
import { UnavailabilityBlock } from './UnavailabilityBlock';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheService } from '@/lib/types/FicheService';
import type { Operator } from '@/lib/types/Operator';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';

const DRAG_THRESHOLD = 4;
const SLOT_HEIGHT_REM = 2; // h-8 in CSS

interface DayViewSlotProps {
  operator: Operator;
  datetime: Date;
  fiches: Fiche[];
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
  /** Fired when the user finishes a click-and-drag on an empty cell. */
  onCreateUnavailability?: (data: { operator: Operator; start: Date; end: Date }) => void;
  /** Fired when the user clicks an existing unavailability block. */
  onSelectUnavailability?: (item: OperatorUnavailability) => void;
  /** True when this slot falls outside the salon's configured operating hours */
  isDisabled?: boolean;
  /** True when this slot is before opening / after closing (beyond the schedule bounds). */
  isExtendedHours?: boolean;
  /** Hour at which the visible time grid for this column starts (e.g. 9). */
  gridStartHour: number;
  /** Hour at which the visible time grid for this column ends (e.g. 20). */
  gridEndHour: number;
}

function getTimeAsMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Group services (already sorted by start_time) into runs of contiguous services. */
function computeRuns(services: FicheService[]): FicheService[][] {
  const runs: FicheService[][] = [];
  for (const fs of services) {
    const last = runs[runs.length - 1];
    const lastSvc = last?.[last.length - 1];
    if (lastSvc && new Date(lastSvc.end_time).getTime() === new Date(fs.start_time).getTime()) {
      last.push(fs);
    } else {
      runs.push([fs]);
    }
  }
  return runs;
}

interface RunStartingHere {
  fiche: Fiche;
  run: FicheService[];
  totalMinutes: number;
  isWholeFiche: boolean;
  /** Vertical offset (in rem) of the run start relative to the anchor slot's top.
   *  Non-zero when the run starts at a time not aligned to the current granularity. */
  topOffsetRem: number;
}

export function DayViewSlot({
  operator,
  datetime,
  fiches,
  onSlotSelected,
  onFicheSelected,
  onCreateUnavailability,
  onSelectUnavailability,
  isDisabled = false,
  isExtendedHours = false,
  gridStartHour,
  gridEndHour,
}: DayViewSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const timeStep =
    useSalonSettingsStore((s) => s.settings?.slot_granularity_min) ?? CALENDAR_CONFIG.daily.timeStep;
  const beginCreate = useUnavailabilityCreateStore((s) => s.begin);
  const updateCreate = useUnavailabilityCreateStore((s) => s.update);
  const endCreate = useUnavailabilityCreateStore((s) => s.end);
  // Suppress click-through on cells when the cursor moved beyond threshold.
  const draggedRef = useRef(false);

  // Subscribe to drag preview so we can highlight invalid zones live.
  const dragActive = useCalendarDragStore((s) => s.active);
  const dragValid = useCalendarDragStore((s) => s.conflict.valid);
  const dragPreview = useCalendarDragStore((s) => s.preview);

  // Fiches that involve this operator AND overlap this time slot.
  // Uses the standard interval-overlap formula (A.start < B.end && A.end > B.start)
  // so that a service starting mid-slot — e.g. 11:15 with 10-min slots — still
  // counts as overlapping its anchor slot (11:10–11:20). Without this, fiches
  // whose start time isn't aligned to the current granularity would disappear.
  const slotFiches = useMemo(() => {
    const slotMinutes = getTimeAsMinutes(datetime);
    return fiches.filter((fiche) => {
      const operatorServices = fiche.getFicheServices().filter((fs) => fs.operator_id === operator.id);
      if (operatorServices.length === 0) return false;
      return operatorServices.some((fs) => {
        const start = getTimeAsMinutes(new Date(fs.start_time));
        const end = getTimeAsMinutes(new Date(fs.end_time));
        return start < slotMinutes + timeStep && end > slotMinutes;
      });
    });
  }, [fiches, operator.id, datetime, timeStep]);

  // Runs (contiguous chains) of this operator's services for each fiche that
  // start within THIS slot. Each run renders as its own FicheBlock.
  const runsStartingHere = useMemo<RunStartingHere[]>(() => {
    const slotMinutes = getTimeAsMinutes(datetime);
    const out: RunStartingHere[] = [];
    for (const fiche of slotFiches) {
      const opServices = fiche
        .getFicheServices()
        .filter((fs) => fs.operator_id === operator.id)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      const runs = computeRuns(opServices);
      const totalServicesInFiche = fiche.getFicheServices().length;
      for (const run of runs) {
        const runStart = getTimeAsMinutes(new Date(run[0].start_time));
        if (runStart >= slotMinutes && runStart < slotMinutes + timeStep) {
          const startMs = new Date(run[0].start_time).getTime();
          const endMs = new Date(run[run.length - 1].end_time).getTime();
          out.push({
            fiche,
            run,
            totalMinutes: Math.round((endMs - startMs) / 60_000),
            isWholeFiche: run.length === totalServicesInFiche,
            topOffsetRem: ((runStart - slotMinutes) / timeStep) * 2,
          });
        }
      }
    }
    return out;
  }, [slotFiches, operator.id, datetime, timeStep]);

  // Unavailabilities owned by this operator that overlap this slot.
  const allUnavailabilities = useOperatorUnavailabilitiesStore((s) => s.items);
  const unavailabilitiesInSlot = useMemo(() => {
    const slotStartMs = datetime.getTime();
    const slotEndMs = slotStartMs + timeStep * 60_000;
    return allUnavailabilities.filter(
      (u) =>
        u.operator_id === operator.id &&
        u.start_at.getTime() < slotEndMs &&
        u.end_at.getTime() > slotStartMs,
    );
  }, [allUnavailabilities, operator.id, datetime, timeStep]);

  // Unavailabilities that anchor their visual block to this slot. The block is
  // clamped to the column's visible grid bounds so all-day / multi-day blocks
  // (which may start at 00:00 or extend past closing) render on the first
  // visible cell that overlaps them, with a height clamped to the visible day.
  const unavailStartingHere = useMemo(() => {
    const slotStartMs = datetime.getTime();
    const slotEndMs = slotStartMs + timeStep * 60_000;
    const dayGridStart = new Date(datetime);
    dayGridStart.setHours(gridStartHour, 0, 0, 0);
    const dayGridEnd = new Date(datetime);
    dayGridEnd.setHours(0, 0, 0, 0);
    dayGridEnd.setHours(gridEndHour, 0, 0, 0);
    const dayGridStartMs = dayGridStart.getTime();
    const dayGridEndMs = dayGridEnd.getTime();

    return unavailabilitiesInSlot
      .map((u) => {
        const renderStart = Math.max(u.start_at.getTime(), dayGridStartMs);
        const renderEnd = Math.min(u.end_at.getTime(), dayGridEndMs);
        return { item: u, renderStart, renderEnd };
      })
      .filter(({ renderStart, renderEnd }) =>
        renderEnd > renderStart && renderStart >= slotStartMs && renderStart < slotEndMs,
      )
      .map(({ item, renderStart, renderEnd }) => ({
        item,
        totalMinutes: Math.max(timeStep, Math.round((renderEnd - renderStart) / 60_000)),
      }));
  }, [unavailabilitiesInSlot, datetime, timeStep, gridStartHour, gridEndHour]);

  const hasUnavailabilityHere = unavailabilitiesInSlot.length > 0;

  const isOccupied = slotFiches.length > 0 || hasUnavailabilityHere;
  const isPast = datetime < new Date();
  const hasBlocksHere = runsStartingHere.length > 0;

  // Live invalid-zone highlight: only when drag is active AND invalid AND this slot
  // falls within the previewed operator + time range.
  const isInvalidPreviewZone = useMemo(() => {
    if (!dragActive || dragValid) return false;
    const slotStart = datetime.getTime();
    const slotEnd = slotStart + timeStep * 60_000;
    return dragPreview.some(
      (seg) =>
        seg.operatorId === operator.id &&
        seg.start.getTime() < slotEnd &&
        seg.end.getTime() > slotStart,
    );
  }, [dragActive, dragValid, dragPreview, operator.id, datetime, timeStep]);

  // Preview band when this cell falls inside the active "create unavailability" drag.
  const createPreview = useUnavailabilityCreateStore((s) => s.preview);
  const isInCreatePreview =
    createPreview &&
    createPreview.operatorId === operator.id &&
    createPreview.start.getTime() < datetime.getTime() + timeStep * 60_000 &&
    createPreview.end.getTime() > datetime.getTime();

  function handleClick() {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (!isOccupied) onSlotSelected({ operator, datetime });
  }

  // An empty slot is a focusable button: Enter and Space book it, like a click.
  function handleSlotKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    onSlotSelected({ operator, datetime });
  }
  const slotLabel = `Nuova fiche: ${operator.firstName}, ${datetime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Only the empty-cell area handles the create-unavailability gesture.
    if (isOccupied || !onCreateUnavailability) return;
    if (e.button !== 0) return;
    // Don't hijack drags that originated on a child (e.g. plus icon area is fine,
    // but if a FicheBlock is added later we still rely on isOccupied).
    e.preventDefault();

    const startClientY = e.clientY;
    const startMs = datetime.getTime();
    const slotMs = timeStep * 60_000;
    // The UI scale changes the root font-size, so measure the slot in px now.
    const slotHeightPx = remToPx(SLOT_HEIGHT_REM);
    let dragged = false;
    draggedRef.current = false;

    const onMove = (mv: PointerEvent) => {
      const deltaY = mv.clientY - startClientY;
      if (!dragged && Math.abs(deltaY) > DRAG_THRESHOLD) {
        dragged = true;
      }
      if (!dragged) return;

      // Snap the cursor delta to whole slots. Negative delta = drag upwards.
      const slotsDelta = Math.round(deltaY / slotHeightPx);
      let startTs = startMs;
      let endTs = startMs + slotMs;
      if (slotsDelta >= 0) {
        endTs = startMs + slotMs + slotsDelta * slotMs;
      } else {
        startTs = startMs + slotsDelta * slotMs;
      }
      const start = new Date(startTs);
      const end = new Date(endTs);
      if (!useUnavailabilityCreateStore.getState().active) {
        beginCreate({ operatorId: operator.id, start, end });
      } else {
        updateCreate({ operatorId: operator.id, start, end });
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const finalPreview = useUnavailabilityCreateStore.getState().preview;

      if (dragged && finalPreview) {
        draggedRef.current = true;
        // Keep the preview band painted while the modal is open; it'll be
        // cleared when the modal closes (Cancel or Confirm).
        onCreateUnavailability({
          operator,
          start: finalPreview.start,
          end: finalPreview.end,
        });
      } else {
        endCreate();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // Closed time reads as a faint diagonal hatch drawn in the hairline colour;
  // hours outside the salon schedule use the same hatch tinted with warning.
  const closedHoursStyle = isDisabled && !isPast
    ? {
        backgroundImage: isExtendedHours
          ? 'repeating-linear-gradient(-45deg, color-mix(in oklab, var(--lume-warning-fg) 16%, transparent) 0 1px, transparent 1px 6px)'
          : 'repeating-linear-gradient(-45deg, var(--lume-line) 0 1px, transparent 1px 6px)',
      }
    : undefined;

  // Past time gets the faintest possible tint; the now-line already marks the boundary.
  const baseBg = isPast
    ? 'bg-[color-mix(in_oklab,var(--lume-text)_2.5%,transparent)]'
    : isExtendedHours
      ? 'bg-[color-mix(in_oklab,var(--lume-warning-fg)_4%,transparent)]'
      : '';

  // Hour lines are hairlines, half hours a faint dash, other steps almost invisible.
  const minutes = datetime.getMinutes();
  const rowLine =
    minutes === 0
      ? 'border-line'
      : minutes === 30
        ? 'border-dashed border-line'
        : 'border-[color-mix(in_oklab,var(--lume-text)_3.5%,transparent)]';

  const slotTooltip = isPast
    ? 'Slot passato — clicca per registrare retroattivamente'
    : isExtendedHours
      ? 'Fuori orari di apertura'
      : undefined;

  return (
    <Tooltip label={slotTooltip}>
    <div
      data-cal-slot
      data-cal-operator={operator.id}
      data-cal-time={datetime.toISOString()}
      className={`flex items-center relative w-full h-8 border-t ${rowLine} ${baseBg} ${
        isOccupied
          ? ''
          // ds-ignore: an empty calendar grid cell, not a list row; the fill marks the slot a click will book
          : 'hover:bg-hover focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--lume-ring-focus)]'
      }`}
      style={closedHoursStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(!isOccupied && { role: 'button', tabIndex: 0, 'aria-label': slotLabel, onKeyDown: handleSlotKeyDown })}
    >
      {/* Invalid drop highlight overlay */}
      {isInvalidPreviewZone && (
        <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--lume-danger-fg)_14%,transparent)] pointer-events-none z-content-floating" />
      )}

      {/* Live preview band while the user click-drags an unavailability */}
      {isInCreatePreview && (
        <div
          className="absolute inset-0 pointer-events-none z-content-floating"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, color-mix(in oklab, var(--lume-accent) 22%, transparent) 0 4px, transparent 4px 8px)',
          }}
        />
      )}

      <div
        // ds-ignore: calendar slot cell, a click-and-drag surface that also hosts fiche blocks, so it cannot be a button; keyboard users create a fiche with Nuova fiche in the command menu (Cmd+K) or on the Fiches page
        className={`w-full h-full flex flex-col items-center justify-center p-1 relative ${
          isOccupied ? '' : 'cursor-pointer'
        }`}
        onClick={isOccupied ? undefined : handleClick}
        onPointerDown={isOccupied ? undefined : handlePointerDown}
      >
        {hasBlocksHere && runsStartingHere.map(({ fiche, run, totalMinutes, isWholeFiche, topOffsetRem }) => (
          <FicheBlock
            key={`${fiche.id}-${run[0].id}`}
            fiche={fiche}
            operatorServices={run}
            totalMinutes={totalMinutes}
            timeStep={timeStep}
            topOffsetRem={topOffsetRem}
            isPast={isPast}
            isBlockDragEligible={isWholeFiche}
            onSelectFiche={() => onFicheSelected(fiche)}
          />
        ))}
        {unavailStartingHere.map(({ item, totalMinutes }) => (
          <UnavailabilityBlock
            key={item.id}
            item={item}
            totalMinutes={totalMinutes}
            timeStep={timeStep}
            onSelect={onSelectUnavailability ?? (() => {})}
          />
        ))}
        {isOccupied && !hasBlocksHere && unavailStartingHere.length === 0 && <div className="w-full h-full" />}
        {!isOccupied && isHovered && <Plus size={14} aria-hidden className="text-[var(--lume-text-muted)]" />}
      </div>
    </div>
    </Tooltip>
  );
}
