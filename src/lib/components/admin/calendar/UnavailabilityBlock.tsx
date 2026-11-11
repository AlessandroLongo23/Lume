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
        // ds-ignore: calendar unavailability block, positioned in the grid and as tall as its duration, not a control-sized button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
        className="absolute left-0.5 right-0.5 top-0 z-raised flex flex-col items-start justify-start gap-0.5 px-2 py-1 text-left
          rounded-md bg-[var(--lume-panel)] text-[var(--lume-text-secondary)]
          shadow-[inset_0_0_0_1px_var(--lume-edge)] hover:shadow-[inset_0_0_0_1px_var(--lume-edge-hover)]
          transition-shadow overflow-hidden cursor-pointer
          focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--lume-ring-focus)]"
        style={{
          height: `${heightRem}rem`,
          backgroundImage:
            'repeating-linear-gradient(-45deg, var(--lume-active) 0 1px, transparent 1px 6px)',
        }}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--lume-text)]">
          <Ban className="size-3 shrink-0 text-[var(--lume-text-secondary)]" aria-label={compact ? 'Non disponibile' : undefined} />
          {!compact && <span>Non disponibile</span>}
        </div>
        {!compact && (
          <div className="tabular-nums text-2xs text-[var(--lume-text-muted)]">
            {format(item.start_at, 'HH:mm')}–{format(item.end_at, 'HH:mm')}
          </div>
        )}
        {!compact && item.note && (
          <div className="text-2xs text-[var(--lume-text-secondary)] line-clamp-2 leading-tight">
            {item.note}
          </div>
        )}
      </button>
    </Tooltip>
  );
}
