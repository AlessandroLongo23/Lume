'use client';

import { motion, useReducedMotion } from 'motion/react';
import { EASE_OUT } from '@/lib/const/motion';
import { Check } from 'lucide-react';

const MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const;
type Milestone = (typeof MILESTONES)[number];

const GOAL: Milestone = 1000;
const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 → ≈251.33

function milestonePct(n: number): string {
  const pct = (n / GOAL) * 100;
  if (pct < 1) return `${pct.toFixed(1)}%`;
  return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

export function MilestonesCard({ activePlusTrial }: { activePlusTrial: number }) {
  const count = activePlusTrial;
  const reduceMotion = useReducedMotion();

  const nextIdx = MILESTONES.findIndex((m) => count < m);
  const nextMilestone: number = nextIdx === -1 ? GOAL : MILESTONES[nextIdx];
  const prevMilestone: number = nextIdx <= 0 ? 0 : MILESTONES[nextIdx - 1];

  const isComplete = count >= GOAL;
  const pctToNext = isComplete
    ? 100
    : nextMilestone === prevMilestone
    ? 100
    : Math.round(((count - prevMilestone) / (nextMilestone - prevMilestone)) * 100);

  const remaining = Math.max(0, nextMilestone - count);
  const dashOffset = CIRCUMFERENCE * (1 - pctToNext / 100);

  return (
    <div className="surface-card flex flex-col gap-4 p-5">

      {/* Header */}
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium tracking-tight text-[var(--lume-text)]">
          Traguardi
        </h2>
        <span className="text-xs text-[var(--lume-text-muted)] tabular-nums">
          {count.toLocaleString('it-IT')} {count === 1 ? 'salone' : 'saloni'} · obiettivo 1.000
        </span>
      </div>

      {/* Ring + next-milestone info */}
      <div className="flex items-center gap-6">
        <div className="relative w-22 h-22 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
            <circle
              cx="44" cy="44" r="40"
              fill="none"
              strokeWidth={6}
              className="stroke-active"
            />
            <motion.circle
              cx="44" cy="44" r="40"
              fill="none"
              strokeWidth={6}
              strokeLinecap="round"
              className="stroke-[var(--lume-accent)]"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: reduceMotion ? 0 : 0.9, ease: EASE_OUT }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg tabular-nums text-[var(--lume-text)]">
              {pctToNext}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--lume-text-secondary)] mb-1.5">
            {isComplete ? 'Obiettivo raggiunto' : 'Prossimo traguardo'}
          </p>
          <p className="text-2xl font-light tabular-nums tracking-tight text-[var(--lume-text)] leading-none">
            {isComplete
              ? `${GOAL.toLocaleString('it-IT')} · 100%`
              : `${nextMilestone.toLocaleString('it-IT')} · ${milestonePct(nextMilestone)}`}
          </p>
          <p className="text-sm text-[var(--lume-text-secondary)] mt-1.5">
            <span className="tabular-nums text-[var(--lume-text)]">
              {count.toLocaleString('it-IT')}
            </span>{' '}
            {count === 1 ? 'salone' : 'saloni'} oggi
            {!isComplete && (
              <> · <span className="tabular-nums text-[var(--lume-text)]">{remaining.toLocaleString('it-IT')}</span> ancora</>
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-line" />

      {/* Milestone chips */}
      <div className="flex flex-wrap gap-1.5">
        {MILESTONES.map((m) => {
          const done    = count >= m;
          const current = !done && m === nextMilestone;
          return (
            <span
              key={m}
              className={[
                'inline-flex items-center gap-1.5 text-xs tabular-nums rounded-md px-2 h-6',
                // Done: check mark + secondary text; next: the shared "current" ring.
                done
                  ? 'text-[var(--lume-text-secondary)]'
                  : current
                  ? 'marker-current'
                  : 'text-[var(--lume-text-muted)]',
              ].join(' ')}
            >
              {done && (
                <Check
                  className="size-3 text-success-strong shrink-0"
                  strokeWidth={3}
                  aria-hidden
                />
              )}
              {m.toLocaleString('it-IT')} · {milestonePct(m)}
            </span>
          );
        })}
      </div>

    </div>
  );
}
