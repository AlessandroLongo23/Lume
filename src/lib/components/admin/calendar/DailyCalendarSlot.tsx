'use client';

import { useState, useMemo } from 'react';
import { format, addMinutes } from 'date-fns';
import { Plus } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { FicheStatus } from '@/lib/types/ficheStatus';
import type { Fiche } from '@/lib/types/Fiche';
import type { Operator } from '@/lib/types/Operator';

interface DailyCalendarSlotProps {
  operator: Operator;
  datetime: Date;
  fiches: Fiche[];
  onSlotSelected: (data: { operator: Operator; datetime: Date }) => void;
  onFicheSelected: (fiche: Fiche) => void;
}

function getTimeAsMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function DailyCalendarSlot({ operator, datetime, fiches, onSlotSelected, onFicheSelected }: DailyCalendarSlotProps) {
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

  function handleClick() {
    if (isPast) return;
    if (isOccupied) {
      onFicheSelected(slotFiches[0]);
    } else {
      onSlotSelected({ operator, datetime });
    }
  }

  return (
    <div className="border-r border-zinc-500/25">
      <div
        className={`flex items-center relative w-full h-8 bg-white dark:bg-zinc-900 border-t ${datetime.getMinutes() === 0 ? 'border-zinc-500/50' : 'border-zinc-500/25'} ${isOccupied && !isStartOfFiche ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
      >
        <button
          className={`w-full h-full flex flex-col items-center justify-center p-1 relative ${isPast ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={handleClick}
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
                className={`absolute top-0 left-0 w-full p-1 text-xs rounded-sm z-10 ${isCreated ? 'bg-green-500/20 border-l-2 border-green-500' : 'bg-amber-500/20 border-l-2 border-amber-500'}`}
                style={{ height: `calc(${ficheRowSpan * 3}rem)` }}
              >
                <div className="font-medium truncate">{client?.getFullName() ?? 'Cliente'}</div>
                <div className="text-xs">
                  <span>{startTime} - {endTime}</span>
                </div>
              </div>
            );
          })}
          {isOccupied && !isStartOfFiche && <div className="w-full h-full" />}
          {!isOccupied && isHovered && !isPast && <Plus size={16} className="text-zinc-400" />}
        </button>
      </div>
    </div>
  );
}
