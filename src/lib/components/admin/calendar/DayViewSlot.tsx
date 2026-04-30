'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useCalendarDragStore } from '@/lib/stores/calendarDrag';
import { CALENDAR_CONFIG } from '@/lib/utils/calendar-config';
import { FicheBlock } from './FicheBlock';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheService } from '@/lib/types/FicheService';
import type { Operator } from '@/lib/types/Operator';

interface DayViewSlotProps {
  operator: Operator;
  datetime: Date;
  fiches: Fiche[];
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
  /** True when this slot falls outside the salon's configured operating hours */
  isDisabled?: boolean;
  /** True when this slot is before opening / after closing (beyond the schedule bounds). */
  isExtendedHours?: boolean;
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
}

export function DayViewSlot({
  operator,
  datetime,
  fiches,
  onSlotSelected,
  onFicheSelected,
  isDisabled = false,
  isExtendedHours = false,
}: DayViewSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const timeStep =
    useSalonSettingsStore((s) => s.settings?.slot_granularity_min) ?? CALENDAR_CONFIG.daily.timeStep;

  // Subscribe to drag preview so we can highlight invalid zones live.
  const dragActive = useCalendarDragStore((s) => s.active);
  const dragValid = useCalendarDragStore((s) => s.conflict.valid);
  const dragPreview = useCalendarDragStore((s) => s.preview);

  // Fiches that involve this operator AND overlap this time slot
  const slotFiches = useMemo(() => {
    const slotMinutes = getTimeAsMinutes(datetime);
    return fiches.filter((fiche) => {
      const operatorServices = fiche.getFicheServices().filter((fs) => fs.operator_id === operator.id);
      if (operatorServices.length === 0) return false;
      return operatorServices.some((fs) => {
        const start = getTimeAsMinutes(new Date(fs.start_time));
        const end = getTimeAsMinutes(new Date(fs.end_time));
        return start <= slotMinutes && end > slotMinutes;
      });
    });
  }, [fiches, operator.id, datetime]);

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
          });
        }
      }
    }
    return out;
  }, [slotFiches, operator.id, datetime, timeStep]);

  const isOccupied = slotFiches.length > 0;
  const isPast = datetime < new Date();
  const isBlocked = isPast;
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

  function handleClick() {
    if (isBlocked) return;
    if (!isOccupied) onSlotSelected({ operator, datetime });
  }

  const closedHoursStyle = isDisabled && !isPast
    ? {
        backgroundImage: isExtendedHours
          ? 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(245,158,11,0.12) 3px, rgba(245,158,11,0.12) 5px)'
          : 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 5px)',
      }
    : undefined;

  const baseBg = isPast
    ? 'bg-zinc-100 dark:bg-zinc-800/80 cursor-default'
    : isExtendedHours
      ? 'bg-amber-500/5 dark:bg-amber-500/10'
      : isDisabled
        ? 'bg-zinc-50 dark:bg-zinc-800/40'
        : isOccupied && !hasBlocksHere
          ? 'bg-zinc-50 dark:bg-zinc-800/50'
          : 'bg-white dark:bg-zinc-900';

  return (
    <div
      data-cal-slot
      data-cal-operator={operator.id}
      data-cal-time={datetime.toISOString()}
      className={`flex items-center relative w-full h-8 border-t ${
        datetime.getMinutes() === 0 ? 'border-zinc-500/50' : 'border-zinc-500/25'
      } ${baseBg}`}
      style={closedHoursStyle}
      onMouseEnter={() => !isBlocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(!isBlocked && !isOccupied && { role: 'button', tabIndex: 0 })}
      title={isPast ? 'Questo orario è passato' : isExtendedHours ? 'Fuori orari di apertura' : undefined}
    >
      {/* Invalid drop highlight overlay */}
      {isInvalidPreviewZone && (
        <div className="absolute inset-0 bg-red-500/15 pointer-events-none z-20" />
      )}

      <div
        className={`w-full h-full flex flex-col items-center justify-center p-1 relative ${
          isBlocked ? 'cursor-default' : isOccupied ? '' : 'cursor-pointer'
        }`}
        onClick={isBlocked || isOccupied ? undefined : handleClick}
      >
        {hasBlocksHere && runsStartingHere.map(({ fiche, run, totalMinutes, isWholeFiche }) => (
          <FicheBlock
            key={`${fiche.id}-${run[0].id}`}
            fiche={fiche}
            operatorServices={run}
            totalMinutes={totalMinutes}
            timeStep={timeStep}
            isPast={isPast}
            isBlockDragEligible={isWholeFiche}
            onSelectFiche={() => onFicheSelected(fiche)}
          />
        ))}
        {isOccupied && !hasBlocksHere && <div className="w-full h-full" />}
        {!isOccupied && isHovered && !isBlocked && <Plus size={16} className="text-zinc-400" />}
      </div>
    </div>
  );
}
