'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { DURATION_GLIDE, EASE_GLIDE } from '@/lib/const/motion';

/**
 * The secondary navigation of a section (settings, statistics): one neutral
 * fill marks the current page and glides to the next one. Indigo is not used:
 * a page is a place, not an action.
 */
export function SectionNav({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <LayoutGroup id={id}>
      {/* Phones: one horizontally scrolling row above the content. md and up: a column. */}
      <nav
        aria-label={label}
        className="flex gap-1 md:gap-5 md:flex-col max-md:-mx-4 max-md:px-4 max-md:overflow-x-auto max-md:no-scrollbar"
      >
        {children}
      </nav>
    </LayoutGroup>
  );
}

export function SectionNavGroup({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="shrink-0">
      {title && (
        <p className="max-md:hidden px-3 mb-1.5 text-xs text-[var(--lume-text-muted)]">
          {title}
          {hint && <span className="ml-1.5">· {hint}</span>}
        </p>
      )}
      <ul className="flex gap-1 md:flex-col md:gap-0.5">{children}</ul>
    </div>
  );
}

export function SectionNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  // On phones the nav is a horizontal strip: bring the current page into view.
  useEffect(() => {
    if (active && window.matchMedia('(max-width: 767px)').matches) {
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }, [active]);
  return (
    <li className="shrink-0">
      <Link
        ref={ref}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex items-center gap-2.5 h-[var(--lume-control-h-md)] px-3 rounded-md text-sm transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)] pointer-coarse:h-11 ${
          active
            ? 'text-[var(--lume-text)]'
            : 'text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] hover:bg-hover'
        }`}
      >
        {active && (
          <motion.span
            layoutId="section-nav-active"
            aria-hidden
            className="absolute inset-0 rounded-md bg-active"
            transition={reduceMotion ? { duration: 0 } : { duration: DURATION_GLIDE, ease: EASE_GLIDE }}
          />
        )}
        <Icon className="relative size-4 shrink-0" strokeWidth={active ? 2 : 1.5} aria-hidden />
        <span className="relative truncate">{label}</span>
      </Link>
    </li>
  );
}
