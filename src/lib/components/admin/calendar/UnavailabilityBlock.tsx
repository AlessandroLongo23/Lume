'use client';

import { format } from 'date-fns';
import { Ban } from 'lucide-react';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import type { OperatorUnavailability } from '@/lib/types/OperatorUnavailability';

interface UnavailabilityBlockProps {
  item: OperatorUnavailability;
  /** Total minutes the rendered block must span (clamped to the visible day). */
  totalMinutes: number;
  timeStep: number;
  onSelect: (item: OperatorUnavailability) => void;
}

export function UnavailabilityBlock({ item, totalMinutes, timeStep, onSelect }: UnavailabilityBlockProps) {
  const heightRem = (totalMinutes / timeStep) * 2;
  const compact = heightRem < 2.2;

  return (
    <Tooltip label={item.note ?? 'Non disponibile'}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
        className="absolute left-0 right-0 top-0 z-raised flex flex-col items-start justify-start gap-0.5 px-2 py-1 text-left
          rounded-sm border border-zinc-300/70 dark:border-zinc-600/60 text-zinc-600 dark:text-zinc-300
          hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors overflow-hidden cursor-pointer"
        style={{
          height: `${heightRem}rem`,
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(113,113,122,0.18) 0 2px, transparent 2px 7px)',
          backgroundColor: 'rgba(244,244,245,0.55)',
        }}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
          <Ban className="size-3 shrink-0" />
          {!compact && <span>Non disponibile</span>}
        </div>
        {!compact && (
          <div className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
            {format(item.start_at, 'HH:mm')}–{format(item.end_at, 'HH:mm')}
          </div>
        )}
        {!compact && item.note && (
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight">
            {item.note}
          </div>
        )}
      </button>
    </Tooltip>
  );
}
