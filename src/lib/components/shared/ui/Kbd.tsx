import type { ReactNode } from 'react';

/**
 * A keyboard key chip: a quiet active-fill square, secondary text, no border.
 * Used for shortcut hints in the command palette, the top-bar search trigger
 * and the sidebar shortcut hint.
 */
export function Kbd({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={[
        'inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-sm shrink-0',
        'bg-active text-[var(--lume-text-secondary)]',
        'font-sans text-2xs font-medium leading-none',
        className,
      ].join(' ')}
    >
      {children}
    </kbd>
  );
}
