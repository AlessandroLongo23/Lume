'use client';

import type { LucideIcon } from 'lucide-react';
import { STATUS_TONE_INK, type StatusTone } from '@/lib/components/shared/ui/StatusDot';

interface DetailChipProps {
  tone?: StatusTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

// Neutral chip; the tone colours only the icon, or a small dot when there is
// no icon (the StatusDot tones). No pastel fills.
export function DetailChip({ tone = 'neutral', icon: Icon, children, onClick, title }: DetailChipProps) {
  const baseClass = 'inline-flex items-center gap-1.5 h-6 text-xs px-2 rounded-md bg-active text-[var(--lume-text-secondary)]';
  const mark = Icon ? (
    <Icon className={`size-3 shrink-0 ${STATUS_TONE_INK[tone]}`} aria-hidden />
  ) : tone !== 'neutral' ? (
    <span aria-hidden className={`size-1.5 shrink-0 rounded-full bg-current ${STATUS_TONE_INK[tone]}`} />
  ) : null;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${baseClass} hover:bg-strong hover:text-[var(--lume-text)] transition-colors duration-[var(--duration-fast)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lume-ring-focus)]`}
      >
        {mark}
        {children}
      </button>
    );
  }

  return (
    <span className={baseClass} title={title}>
      {mark}
      {children}
    </span>
  );
}
