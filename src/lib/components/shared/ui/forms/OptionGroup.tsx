'use client';

import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

export type Option<T extends string> = { value: T; label: string; icon: React.ElementType; hint?: string };

/**
 * A row of mutually exclusive choices for a settings page. The chosen one
 * gets a neutral fill and full-strength text: indigo stays for actions.
 * Options wrap onto a second line on narrow screens.
 */
export function OptionGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {options.map(({ value: v, label, icon: Icon, hint }) => {
        const selected = v === value;
        const button = (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(v)}
            className={`inline-flex items-center gap-2 h-[var(--lume-control-h-md)] px-3 rounded-lg text-sm font-medium transition-colors duration-[var(--duration-fast)] pointer-coarse:h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)] ${
              selected
                ? 'bg-active text-[var(--lume-text)] shadow-[inset_0_0_0_1px_var(--lume-edge-hover)]'
                : 'text-[var(--lume-text-secondary)] shadow-[inset_0_0_0_1px_var(--lume-edge)] hover:bg-hover hover:text-[var(--lume-text)]'
            }`}
          >
            <Icon className="size-4 shrink-0" strokeWidth={selected ? 2 : 1.5} aria-hidden />
            {label}
          </button>
        );
        return hint ? (
          <Tooltip key={v} label={hint}>
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </div>
  );
}
