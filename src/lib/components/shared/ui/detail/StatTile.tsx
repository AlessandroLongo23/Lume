'use client';

import { motion, useReducedMotion } from 'motion/react';

type Tone = 'neutral' | 'primary' | 'emerald' | 'sky' | 'amber' | 'red';

const accentTextClasses: Record<Tone, string> = {
  neutral: 'text-zinc-500 dark:text-zinc-400',
  primary: 'text-primary',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
};

const accentBarClasses: Record<Tone, string> = {
  neutral: 'bg-zinc-400',
  primary: 'bg-primary',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: { tone: Tone; text: string };
  children?: React.ReactNode;
}

export function StatTile({ label, value, hint, accent, children }: StatTileProps) {
  return (
    <div className="rounded-xl border border-zinc-500/15 bg-zinc-50/60 dark:bg-zinc-900/40 px-5 py-4 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        {accent && (
          <span className={`text-[11px] font-medium ${accentTextClasses[accent.tone]}`}>
            {accent.text}
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
      {children}
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1">{hint}</p>
      )}
    </div>
  );
}

interface SegmentedBarProps {
  filled: number;
  total?: number;
  tone?: Tone;
  groupDelay?: number;
}

export function SegmentedBar({ filled, total = 5, tone = 'primary', groupDelay = 0 }: SegmentedBarProps) {
  const reduceMotion = useReducedMotion();
  const accent = accentBarClasses[tone];
  return (
    <div className="flex items-center gap-1" aria-label={`${filled} su ${total}`}>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => {
        const isOn = i <= filled;
        return (
          <div
            key={i}
            className="relative h-1.5 flex-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden"
          >
            {isOn && (
              <motion.div
                className={`absolute inset-0 ${accent} rounded-full origin-left`}
                initial={reduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: reduceMotion ? 0 : groupDelay + 0.18 + (i - 1) * 0.05,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ProgressBarProps {
  ratio: number; // 0..1+
  tone?: Tone;
  delay?: number;
}

export function ProgressBar({ ratio, tone = 'primary', delay = 0 }: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative h-1.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${accentBarClasses[tone]}`}
        initial={reduceMotion ? { width: `${clamped * 100}%` } : { width: 0 }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </div>
  );
}
