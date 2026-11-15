import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepState = 'done' | 'current' | 'todo';

/**
 * The numbered circle of a multi-step flow, shared by the sign-up
 * StepProgressBar and the public booking step cards. Done is filled with the
 * text colour (the checkbox "on" look), current wears marker-current, the
 * rest are a plain edge. Indigo stays on the primary button.
 */
export function StepMarker({ index, state }: { index: number; state: StepState }) {
  return (
    <span
      className={cn(
        'size-7 shrink-0 rounded-full grid place-items-center tabular-nums text-xs',
        'transition-[background-color,box-shadow,color] duration-[var(--duration-base)] ease-[var(--ease-glide)] motion-reduce:transition-none',
        state === 'done' && 'marker-done',
        state === 'current' && 'marker-current',
        state === 'todo' && 'text-[var(--lume-text-muted)] shadow-[inset_0_0_0_1px_var(--lume-edge)]',
      )}
    >
      {state === 'done' ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : index}
    </span>
  );
}
