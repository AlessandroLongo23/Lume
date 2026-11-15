'use client';

import { Check, RotateCcw } from 'lucide-react';
import { CATEGORY_PICKER_COLORS } from '@/lib/const/category-colors';
import { cn } from '@/lib/utils';

interface ColorSwatchPickerProps {
  /** Chosen colour, or null for "automatic" when `allowAuto` is set. */
  value: string | null;
  onChange: (color: string | null) => void;
  /** Palette; defaults to the category/client identity colours. */
  colors?: readonly string[];
  /** Show "Reimposta automatico" (back to null) while a colour is chosen. */
  allowAuto?: boolean;
  /** Muted line under the swatches. */
  hint?: string;
  /** Swatches per row. */
  columns?: number;
  ariaLabel?: string;
}

/**
 * Pick an identity colour (clients, categories). The chosen swatch shows a
 * check: no outer outline, so nothing is clipped inside a scrolling dialog.
 */
export function ColorSwatchPicker({
  value,
  onChange,
  colors = CATEGORY_PICKER_COLORS,
  allowAuto = false,
  hint,
  columns = 4,
  ariaLabel = 'Colore',
}: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-col gap-2 w-fit">
      <div role="radiogroup" aria-label={ariaLabel} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {colors.map((c) => {
          const selected = value === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c}
              onClick={() => onChange(c)}
              className={cn(
                'grid place-items-center size-7 pointer-coarse:size-10 rounded-md',
                'shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--lume-text)_12%,transparent)]',
                'transition-transform duration-[var(--duration-fast)] hover:scale-105 active:scale-95 motion-reduce:transform-none',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
              )}
              style={{ backgroundColor: c }}
            >
              {selected && <Check aria-hidden className="size-4 text-[var(--lume-text-on-accent)] drop-shadow-sm" strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>
      {hint && <p className="text-xs text-[var(--lume-text-secondary)] leading-snug max-w-40">{hint}</p>}
      {allowAuto && value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 self-start h-8 pointer-coarse:h-11 text-xs text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] transition-colors"
        >
          <RotateCcw className="size-3" aria-hidden />
          Reimposta automatico
        </button>
      )}
    </div>
  );
}
