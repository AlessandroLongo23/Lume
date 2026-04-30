type Variant = 'neutral' | 'primary' | 'solid';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  primary: 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary/80',
  solid: 'bg-primary text-white',
};

const sizeClasses: Record<Size, string> = {
  sm: 'min-w-4 h-4 px-1 text-[10px]',
  md: 'min-w-5 h-5 px-1.5 text-xs',
};

export function NumberBadge({
  value,
  variant = 'neutral',
  size = 'sm',
  max,
  className = '',
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
      className={[
        'inline-flex items-center justify-center rounded-full font-medium tabular-nums leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {display}
    </span>
  );
}
