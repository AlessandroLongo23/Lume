'use client';

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

  return (
    <div
      className={`flex flex-row items-center rounded-lg overflow-hidden border border-zinc-500/25
        ${style === 'elevated' ? 'shadow-sm' : ''}
        ${className}`}
    >
      {options.map((opt, i) => {
        const isActive = currentValue === opt;
        const Icon = icons?.[i];
        const label = labels?.[i];

        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm transition-colors
              ${isActive
                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                : 'bg-white dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }
              ${i > 0 ? 'border-l border-zinc-500/25' : ''}`}
          >
            {Icon && <Icon className="size-4" />}
            {label && <span>{label}</span>}
            {!Icon && !label && <span>{String(opt)}</span>}
          </button>
        );
      })}
    </div>
  );
}
