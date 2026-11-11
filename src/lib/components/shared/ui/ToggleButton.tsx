'use client';

import { useId, useRef } from 'react';
import { useHoverGlide } from '@/lib/hooks/useHoverGlide';
import { motion, useReducedMotion } from 'motion/react';
import { DURATION_GLIDE, EASE_GLIDE } from '@/lib/const/motion';
import { cn } from '@/lib/utils';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ToggleButtonProps {
  options: any[];
  value: any;
  onChange: (value: any) => void;
  labels?: string[];
  icons?: React.ComponentType<any>[];
  className?: string;
  /** Optional stable anchor for guided tours (rendered on the radiogroup root). */
  dataTour?: string;
  /** Accessible name of the group. */
  ariaLabel?: string;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ToggleButton({
  options,
  value,
  onChange,
  labels,
  icons,
  className,
  dataTour,
  ariaLabel,
}: ToggleButtonProps) {
  const currentValue = value ?? options[0];
  const isIconOnly = !!icons && !labels;
  const pillId = useId();
  const reduceMotion = useReducedMotion();
  // Hover preview: a fainter pill born at the selected segment that travels
  // to the one under the pointer (EDL's toggle group).
  const groupRef = useRef<HTMLDivElement>(null);
  const glowRef = useHoverGlide(groupRef, '[role="radio"]', { originSelector: '[aria-checked="true"]' });

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + options.length) % options.length;
    }
    if (nextIdx !== null) {
      onChange(options[nextIdx]);
      const container = (e.target as HTMLElement).parentElement;
      const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIdx]?.focus();
    }
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      data-tour={dataTour}
      // A md control: 44px on touch screens, like Button md and `control-md`.
      className={cn(
        // ds-ignore: 3px inset = the 1px inset edge plus 2px clear, the same 2px as the gap-0.5 between segments
        'relative inline-flex flex-row items-center rounded-lg p-[0.1875rem] gap-0.5',
        'h-[var(--lume-control-h-md)] pointer-coarse:h-[var(--lume-control-h-lg)] shadow-[inset_0_0_0_1px_var(--lume-edge)]',
        'bg-[var(--lume-button-secondary-bg)]',
        className,
      )}
    >
      <span ref={glowRef} className="hover-glide hover-glide--preview rounded-md" aria-hidden />
      {options.map((opt, i) => {
        const isActive = currentValue === opt;
        const Icon = icons?.[i];
        const label = labels?.[i];

        return (
          <button
            key={String(opt)}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label ?? (Icon ? String(opt) : undefined)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={[
              'relative h-full inline-flex items-center justify-center rounded-md whitespace-nowrap',
              'gap-[var(--lume-control-gap-md)] text-[length:var(--lume-control-text-md)] font-medium',
              'transition-colors duration-[var(--duration-base)] ease-[var(--ease-in-out)]',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
              isIconOnly
                ? 'aspect-square p-0'
                : 'flex-1 px-[var(--lume-control-px-md)]',
              // Selected is a neutral fill and full-strength text: indigo is
              // kept for actions, not for "this one is chosen".
              isActive
                ? 'text-[var(--lume-text)]'
                : 'text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)]',
            ].join(' ')}
          >
            {isActive && (
              <motion.span
                layoutId={`toggle-pill-${pillId}`}
                aria-hidden
                className="absolute inset-0 rounded-md bg-active"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: DURATION_GLIDE, ease: EASE_GLIDE }
                }
              />
            )}
            <span className="relative inline-flex items-center gap-[var(--lume-control-gap-md)]">
              {Icon && <Icon className="size-4 shrink-0" />}
              {label && <span>{label}</span>}
              {!Icon && !label && <span>{String(opt)}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
