'use client';

import { useState, useMemo } from 'react';
import { format, addMinutes } from 'date-fns';
import { Plus } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { FicheStatus } from '@/lib/types/ficheStatus';
import type { Fiche } from '@/lib/types/Fiche';
import type { Operator } from '@/lib/types/Operator';

interface DayViewSlotProps {
  operator: Operator;
  datetime: Date;
  fiches: Fiche[];
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
  /** True when this slot falls outside the salon's configured operating hours */
  isDisabled?: boolean;
}

function getTimeAsMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function DayViewSlot({ operator, datetime, fiches, onSlotSelected, onFicheSelected, isDisabled = false }: DayViewSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const clients = useClientsStore((s) => s.clients);

  // Fiches that involve this operator AND overlap this time slot
  const slotFiches = useMemo(() => {
    const slotMinutes = getTimeAsMinutes(datetime);
    return fiches.filter((fiche) => {
      const ficheServices = fiche.getFicheServices();
      const operatorServices = ficheServices.filter((fs) => fs.operator_id === operator.id);
      if (operatorServices.length === 0) return false;
      // Check if any service overlaps this slot
      return operatorServices.some((fs) => {
        const start = getTimeAsMinutes(new Date(fs.start_time));
        const end = getTimeAsMinutes(new Date(fs.end_time));
        return start <= slotMinutes && end > slotMinutes;
      });
    });
  }, [fiches, operator.id, datetime]);

  const isStartOfFiche = useMemo(() => {
    const slotMinutes = getTimeAsMinutes(datetime);
    return slotFiches.some((fiche) => {
      const ficheServices = fiche.getFicheServices().filter((fs) => fs.operator_id === operator.id);
      return ficheServices.some((fs) => getTimeAsMinutes(new Date(fs.start_time)) === slotMinutes);
    });
  }, [slotFiches, operator.id, datetime]);

  const ficheRowSpan = useMemo(() => {
    if (!isStartOfFiche || slotFiches.length === 0) return 1;
    return Math.ceil(slotFiches[0].getDuration() / 15);
  }, [isStartOfFiche, slotFiches]);

  const isOccupied = slotFiches.length > 0;
  const isPast = datetime < new Date();
  // A slot is non-interactive when it is in the past OR outside operating hours
  const isBlocked = isPast || isDisabled;

  function handleClick() {
    if (isBlocked) return;
    if (isOccupied) {
      onFicheSelected(slotFiches[0]);
    } else {
      onSlotSelected({ operator, datetime });
    }
  }

  // Diagonal stripe pattern for closed-hours slots (light mode only;
  // dark mode uses the bg colour alone for subtlety)
  const closedHoursStyle = isDisabled && !isPast
    ? {
        backgroundImage:
          'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 5px)',
      }
    : undefined;

  return (
    <div
      className={`flex items-center relative w-full h-8 border-t ${
        datetime.getMinutes() === 0 ? 'border-zinc-500/50' : 'border-zinc-500/25'
      } ${
        isPast
          ? 'bg-zinc-100 dark:bg-zinc-800/80 cursor-default'
          : isDisabled
            ? 'bg-zinc-50 dark:bg-zinc-800/40 cursor-default'
            : isOccupied && !isStartOfFiche
              ? 'bg-zinc-50 dark:bg-zinc-800/50'
              : 'bg-white dark:bg-zinc-900'
      }`}
      style={closedHoursStyle}
      onMouseEnter={() => !isBlocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(!isBlocked && { role: 'button', tabIndex: 0 })}
      title={isPast ? 'Questo orario è passato' : isDisabled ? 'Il salone è chiuso in questo orario' : undefined}
    >
      <button
        className={`w-full h-full flex flex-col items-center justify-center p-1 relative ${
          isBlocked ? 'cursor-default' : 'cursor-pointer'
        }`}
        onClick={handleClick}
        disabled={isBlocked}
        type="button"
      >
        {isOccupied && isStartOfFiche && slotFiches.map((fiche) => {
          const client = clients.find((c) => c.id === fiche.client_id);
          const isCreated = fiche.status === FicheStatus.CREATED;
          const ficheServices = fiche.getFicheServices().filter((fs) => fs.operator_id === operator.id);
          const startTime = ficheServices[0] ? format(new Date(ficheServices[0].start_time), 'HH:mm') : format(new Date(fiche.datetime), 'HH:mm');
          const endTime = ficheServices[0] ? format(new Date(ficheServices[0].end_time), 'HH:mm') : format(addMinutes(new Date(fiche.datetime), fiche.getDuration()), 'HH:mm');
          return (
            <div
              key={fiche.id}
              className={`absolute top-0 left-0 w-full p-1 text-xs rounded-sm z-10 ${
                isPast ? 'opacity-50' : ''
              } ${isCreated ? 'bg-green-500/20 border-l-2 border-green-500' : 'bg-amber-500/20 border-l-2 border-amber-500'}`}
              style={{ height: `calc(${ficheRowSpan * 2}rem)` }}
            >
              <div className="font-medium truncate">{client?.getFullName() ?? 'Cliente'}</div>
              <div className="text-xs">
                <span>{startTime} - {endTime}</span>
              </div>
            </div>
          );
        })}
        {isOccupied && !isStartOfFiche && <div className="w-full h-full" />}
        {!isOccupied && isHovered && !isBlocked && <Plus size={16} className="text-zinc-400" />}
      </button>
    </div>
  );
}
