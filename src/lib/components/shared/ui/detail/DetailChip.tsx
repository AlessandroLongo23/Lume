'use client';

import type { LucideIcon } from 'lucide-react';

type Tone = 'amber' | 'sky' | 'emerald' | 'red' | 'zinc' | 'primary';

interface DetailChipProps {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
}

const toneClasses: Record<Tone, string> = {
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
  zinc: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  primary: 'bg-primary/10 text-primary',
};

const toneHoverClasses: Record<Tone, string> = {
  amber: 'hover:bg-amber-500/20',
  sky: 'hover:bg-sky-500/20',
  emerald: 'hover:bg-emerald-500/20',
  red: 'hover:bg-red-500/20',
  zinc: 'hover:bg-zinc-500/20',
  primary: 'hover:bg-primary/20',
};

export function DetailChip({ tone = 'zinc', icon: Icon, children, onClick, title }: DetailChipProps) {
  const baseClass = `inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${toneClasses[tone]}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`${baseClass} ${toneHoverClasses[tone]} transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40`}
      >
        {Icon && <Icon className="size-3" />}
        {children}
      </button>
    );
  }

  return (
    <span className={baseClass} title={title}>
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}
