'use client';

import type { LucideIcon } from 'lucide-react';

type Tone = 'amber' | 'sky' | 'emerald' | 'red' | 'zinc' | 'primary';

interface DetailChipProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const toneClasses: Record<Tone, string> = {
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  zinc: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  primary: 'bg-primary/10 text-primary',
};

export function DetailChip({ tone = 'zinc', icon: Icon, children }: DetailChipProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${toneClasses[tone]}`}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}
