'use client';

import { motion } from 'motion/react';
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
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card">

      {/* Header */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Traguardi
        </span>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
          {count.toLocaleString('it-IT')} {count === 1 ? 'salone' : 'saloni'} · obiettivo 1.000
        </span>
      </div>

      {/* Ring + next-milestone info */}
      <div className="flex items-center gap-6">
        <div className="relative w-[88px] h-[88px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
            <circle
              cx="44" cy="44" r="40"
              fill="none"
              strokeWidth={6}
              className="stroke-zinc-100 dark:stroke-zinc-800"
            />
            <motion.circle
              cx="44" cy="44" r="40"
              fill="none"
              strokeWidth={6}
              strokeLinecap="round"
              className="stroke-indigo-500"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
              {pctToNext}%
            </span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
            {isComplete ? 'Obiettivo raggiunto' : 'Prossimo traguardo'}
          </p>
          <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-white leading-none">
            {isComplete
              ? `${GOAL.toLocaleString('it-IT')} · 100%`
              : `${nextMilestone.toLocaleString('it-IT')} · ${milestonePct(nextMilestone)}`}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 tabular-nums">
            <span className="text-zinc-700 dark:text-zinc-300">
              {count.toLocaleString('it-IT')}
            </span>{' '}
            {count === 1 ? 'salone' : 'saloni'} oggi
            {!isComplete && (
              <> · <span className="text-zinc-700 dark:text-zinc-300">{remaining.toLocaleString('it-IT')}</span> ancora</>
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Milestone chips */}
      <div className="flex flex-wrap gap-1.5">
        {MILESTONES.map((m) => {
          const done    = count >= m;
          const current = !done && m === nextMilestone;
          return (
            <span
              key={m}
              className={[
                'inline-flex items-center gap-1.5 text-[11px] tabular-nums rounded-md px-2.5 py-1 border',
                done
                  ? 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'
                  : current
                  ? 'border-indigo-300/60 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10 font-medium'
                  : 'border-transparent text-zinc-400 dark:text-zinc-600 opacity-50',
              ].join(' ')}
            >
              {done && (
                <Check
                  className="w-3 h-3 text-emerald-500 shrink-0"
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
