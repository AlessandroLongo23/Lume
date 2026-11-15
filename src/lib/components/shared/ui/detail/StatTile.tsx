'use client';

import { motion, useReducedMotion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/const/motion';
import { StatusDot, STATUS_TONE_INK, type StatusTone } from '@/lib/components/shared/ui/StatusDot';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** A short reading of the figure ("12%", "Sotto soglia"): a StatusDot on the right of the label. */
  accent?: { tone: StatusTone; text: string };
  children?: React.ReactNode;
}

/**
 * One figure of an entity on a detail page, in a card. Pages with several
 * headline figures side by side use StatRow + Stat instead.
 */
export function StatTile({ label, value, hint, accent, children }: StatTileProps) {
  return (
    <div className="surface-card px-5 py-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-[var(--lume-text-secondary)]">{label}</span>
        {accent && (
          <StatusDot tone={accent.tone} className="text-xs text-[var(--lume-text-secondary)]">
            {accent.text}
          </StatusDot>
        )}
      </div>
      <p className="text-headline leading-tight tabular-nums font-normal tracking-tight text-[var(--lume-text)]">
        {value}
      </p>
      {children}
      {hint && (
        <p className="text-xs text-[var(--lume-text-secondary)] -mt-1">{hint}</p>
      )}
    </div>
  );
}

interface ProgressBarProps {
  /** 0..1; larger values fill the bar. */
  ratio: number;
  tone: StatusTone;
}

/** A thin bar inside a StatTile (stock against its threshold). The tone colours the fill. */
export function ProgressBar({ ratio, tone }: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative h-1.5 rounded-full bg-active overflow-hidden">
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full bg-current ${STATUS_TONE_INK[tone]}`}
        initial={reduceMotion ? { width: `${clamped * 100}%` } : { width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: DURATION.count, ease: EASE_OUT, delay: 0.1 }}
      />
    </div>
  );
}
