'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ToggleButtonProps {
  options: any[];
  value: any;
  onChange: (value: any) => void;
  labels?: string[];
  icons?: React.ComponentType<any>[];
  style?: 'flat' | 'elevated';
  className?: string;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function ToggleButton({
  options,
  value,
  onChange,
  labels,
  icons,
  style = 'flat',
  className = '',
}: ToggleButtonProps) {
  const currentValue = value ?? options[0];
  const isIconOnly = !!icons && !labels;
  const pillId = useId();
  const reduceMotion = useReducedMotion();

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
      role="radiogroup"
      className={[
        'inline-flex flex-row items-center rounded-lg p-[3px] gap-[2px]',
        'h-[var(--lume-control-h-md)] border border-[var(--lume-border)]',
        'bg-[var(--lume-button-secondary-bg)]',
        style === 'elevated' ? 'shadow-[var(--shadow-sm)]' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
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
              'relative h-full inline-flex items-center justify-center rounded-md',
              'gap-[var(--lume-control-gap-md)] text-[length:var(--lume-control-text-md)] font-medium',
              'transition-colors duration-[var(--duration-base)] ease-[var(--ease-in-out)]',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
              isIconOnly
                ? 'aspect-square p-0'
                : 'flex-1 px-[var(--lume-control-px-md)]',
              isActive
                ? 'text-[var(--lume-accent)]'
                : 'text-[var(--lume-text-secondary)] hover:bg-[var(--lume-button-secondary-bg-hover)]',
            ].join(' ')}
          >
            {isActive && (
              <motion.span
                layoutId={`toggle-pill-${pillId}`}
                aria-hidden
                className="absolute inset-0 rounded-md bg-[var(--lume-accent-muted)]"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 500, damping: 38, mass: 0.8 }
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
