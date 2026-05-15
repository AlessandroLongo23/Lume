'use client';

import { RotateCcw } from 'lucide-react';
import { CATEGORY_PICKER_COLORS } from '@/lib/const/category-colors';

interface ClientColorPickerProps {
  /** Current explicit override, or null when the client is on the auto-hash color. */
  value: string | null;
  onChange: (color: string | null) => void;
  /** Client id — kept on the interface for callers that pass it; not used
   *  visually here (auto-state is conveyed by the hint copy instead). */
  clientId?: string;
  /** Hide the reset-to-auto button when the picker is used for a new client. */
  showResetToAuto?: boolean;
}

export function ClientColorPicker({
  value,
  onChange,
  showResetToAuto = true,
}: ClientColorPickerProps) {
  const isAuto = value === null;

  return (
    <div className="flex flex-col gap-2 w-fit">
      <div className="grid grid-cols-4 gap-1.5">
        {CATEGORY_PICKER_COLORS.map((c) => {
          const selected = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="size-7 rounded-md border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: selected ? 'white' : 'transparent',
                outline: selected ? `2px solid ${c}` : 'none',
              }}
              aria-label={c}
              aria-pressed={selected}
            />
          );
        })}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug max-w-32">
        Puoi cambiare il colore in qualsiasi momento.
      </p>
      {!isAuto && showResetToAuto && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors self-start"
        >
          <RotateCcw className="size-3" />
          Reimposta automatico
        </button>
      )}
    </div>
  );
}
