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
  const isIconOnly = !!icons && !labels;

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
      // Move focus to the newly selected button
      const container = (e.target as HTMLElement).parentElement;
      const buttons = container?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIdx]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
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
            role="radio"
            aria-checked={isActive}
            aria-label={label ?? (Icon ? String(opt) : undefined)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`flex items-center justify-center gap-1.5 text-sm transition-all
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:z-10
              ${isIconOnly ? 'size-9' : 'flex-1 px-3 py-2'}
              ${isActive
                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
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
