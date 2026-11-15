'use client';

import { createContext, useContext, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useHoverGlide } from '@/lib/hooks/useHoverGlide';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { DURATION_GLIDE, EASE_GLIDE } from '@/lib/const/motion';
import { cn } from '@/lib/utils';
import { NumberBadge } from './NumberBadge';

const TabBarContext = createContext<string | null>(null);

interface TabBarProps {
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
  'data-tour'?: string;
  children: ReactNode;
}

/**
 * A row of page-level tabs. The selected tab sits on a neutral pill that
 * glides to the new tab; hover previews with a fainter fill. Indigo is not
 * used: a tab is a place, not an action.
 */
export function TabBar({ label, className, children, ...rest }: TabBarProps) {
  const id = useId();
  // Hover preview born at the selected tab, travelling to the hovered one.
  const listRef = useRef<HTMLDivElement>(null);
  const glowRef = useHoverGlide(listRef, '[role="tab"]', { originSelector: '[aria-selected="true"]' });
  return (
    <LayoutGroup id={id}>
      <TabBarContext.Provider value={id}>
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          className={cn('relative flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar', className)}
          {...rest}
        >
          <span ref={glowRef} className="hover-glide hover-glide--preview" aria-hidden />
          {children}
        </div>
      </TabBarContext.Provider>
    </LayoutGroup>
  );
}

interface TabButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'role'> {
  active: boolean;
  /** A count after the label, stronger on the selected tab. `undefined` shows none. */
  count?: number;
  children: ReactNode;
}

export function TabButton({ active, count, className, children, ...rest }: TabButtonProps) {
  const barId = useContext(TabBarContext);
  const reduceMotion = useReducedMotion();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'relative shrink-0 inline-flex items-center gap-2 h-[var(--lume-control-h-md)] px-3 rounded-md',
        'text-[length:var(--lume-control-text-md)] font-medium whitespace-nowrap',
        'transition-colors duration-[var(--duration-fast)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]',
        active
          ? 'text-[var(--lume-text)]'
          : 'text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)]',
        className,
      )}
      {...rest}
    >
      {active && (
        <motion.span
          layoutId={`tab-pill-${barId}`}
          aria-hidden
          className="absolute inset-0 rounded-md bg-active"
          transition={reduceMotion ? { duration: 0 } : { duration: DURATION_GLIDE, ease: EASE_GLIDE }}
        />
      )}
      <span className="relative inline-flex items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0">
        {children}
        {count !== undefined && <NumberBadge value={count} variant={active ? 'strong' : 'neutral'} />}
      </span>
    </button>
  );
}
