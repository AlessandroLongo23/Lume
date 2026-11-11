'use client';

import type { Ref } from 'react';
import { Loader2, Search } from 'lucide-react';

interface CommandSearchFieldProps {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Shows a spinner at the end while results load. */
  loading?: boolean;
}

/**
 * The search line at the top of the ⌘K palettes (full and basic): a bare
 * input under the panel's own edge, no field box. `Searchbar` draws a boxed
 * control, which would sit as a box inside the box here.
 */
export function CommandSearchField({ ref, value, onChange, placeholder, loading = false }: CommandSearchFieldProps) {
  return (
    <div className="flex items-center gap-3 h-12 px-4 shrink-0 border-b border-line">
      <Search className="size-4 text-[var(--lume-text-muted)] shrink-0" strokeWidth={1.75} aria-hidden />
      <input
        // ds-ignore: cmd+K palette search line, a bare input under the panel edge; Searchbar and FormInput draw a boxed control (a box inside the box) and Searchbar takes no ref for autofocus
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Cerca"
        className="flex-1 min-w-0 h-full bg-transparent p-0 text-base text-[var(--lume-text)] placeholder:text-[var(--lume-text-muted)] outline-none! ring-0! border-0 shadow-none!"
      />
      {loading && (
        <Loader2 className="size-4 text-[var(--lume-text-muted)] shrink-0 animate-spin" strokeWidth={1.75} aria-hidden />
      )}
    </div>
  );
}
