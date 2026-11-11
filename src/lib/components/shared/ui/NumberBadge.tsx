import { cn } from '@/lib/utils';

type Variant = 'neutral' | 'strong' | 'accent';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-active text-[var(--lume-text-secondary)]',
  // The count of the selected tab, or of a filter that is applied: a stronger
  // neutral, not indigo, so it reads as "here" and not as something to act on.
  strong: 'bg-strong text-[var(--lume-text)]',
  // A count that needs attention (unread notifications).
  accent: 'bg-[var(--lume-accent)] text-[var(--lume-text-on-accent)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'min-w-4 h-4 px-1 text-2xs',
  md: 'min-w-5 h-5 px-1.5 text-xs',
};

/** A count in a small pill. Inside a TabButton pass `count` to the tab instead. */
export function NumberBadge({
  value,
  variant = 'neutral',
  size = 'md',
  max,
  className,
}: {
  value: number;
  variant?: Variant;
  size?: Size;
  max?: number;
  className?: string;
}) {
  const display = max != null && value > max ? `${max}+` : value;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full tabular-nums font-medium leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {display}
    </span>
  );
}
