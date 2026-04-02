'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
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

/** Append a 2-digit hex opacity suffix to a hex color string */
function withOpacity(hex: string, opacity: number): string {
  const clamped = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return `${hex}${clamped.toString(16).padStart(2, '0')}`;
}

export function DayViewSlot({ operator, datetime, fiches, onSlotSelected, onFicheSelected, isDisabled = false }: DayViewSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);
  const categories = useServiceCategoriesStore((s) => s.service_categories);

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
      if (ficheServices.length === 0) return false;
      const minStart = Math.min(...ficheServices.map((fs) => getTimeAsMinutes(new Date(fs.start_time))));
      return minStart === slotMinutes;
    });
  }, [slotFiches, operator.id, datetime]);

  const ficheRowSpan = useMemo(() => {
    if (!isStartOfFiche || slotFiches.length === 0) return 1;
    const operatorServices = slotFiches[0].getFicheServices().filter((fs) => fs.operator_id === operator.id);
    if (operatorServices.length === 0) return 1;
    const minStart = Math.min(...operatorServices.map((fs) => getTimeAsMinutes(new Date(fs.start_time))));
    const maxEnd = Math.max(...operatorServices.map((fs) => getTimeAsMinutes(new Date(fs.end_time))));
    return Math.ceil((maxEnd - minStart) / 15);
  }, [isStartOfFiche, slotFiches, operator.id]);

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
          const ficheServices = fiche.getFicheServices().filter((fs) => fs.operator_id === operator.id);

          // Derive the accent color from the first service's category
          const firstSvcObj = ficheServices[0] ? services.find((s) => s.id === ficheServices[0].service_id) : null;
          const firstCat = firstSvcObj ? categories.find((c) => c.id === firstSvcObj.category_id) : null;
          const accentColor = firstCat?.color ?? '#6366F1';

          return (
            <div
              key={fiche.id}
              className={`absolute top-0 left-0 w-full flex flex-col rounded-md z-10 overflow-hidden shadow-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 ${
                isPast ? 'opacity-60' : ''
              }`}
              style={{
                height: `calc(${ficheRowSpan * 2}rem)`,
                borderLeft: `3px solid ${accentColor}`,
              }}
            >
              {ficheServices.map((fs, index) => {
                const service = services.find((s) => s.id === fs.service_id);
                const category = service
                  ? categories.find((c) => c.id === service.category_id)
                  : null;
                const color = category?.color ?? '#6366F1';
                const blockHeightRem = (fs.duration / 15) * 2;
                const startTime = format(new Date(fs.start_time), 'HH:mm');
                const endTime = format(new Date(fs.end_time), 'HH:mm');

                return (
                  <div
                    key={fs.id}
                    className="overflow-hidden px-2 py-1 shrink-0 text-left"
                    style={{
                      height: `${blockHeightRem}rem`,
                      backgroundColor: withOpacity(color, 0.13),
                      borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                    }}
                  >
                    {index === 0 && (
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight mb-0.5">
                        {client?.getFullName() ?? 'Cliente'}
                      </p>
                    )}
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate leading-tight">
                      {service?.name ?? 'Servizio'}
                      {blockHeightRem >= 2 && (
                        <span className="text-zinc-500 dark:text-zinc-400"> • {startTime}–{endTime}</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}
        {isOccupied && !isStartOfFiche && <div className="w-full h-full" />}
        {!isOccupied && isHovered && !isBlocked && <Plus size={16} className="text-zinc-400" />}
      </button>
    </div>
  );
}
