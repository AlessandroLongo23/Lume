'use client';

import type { LucideIcon } from 'lucide-react';

export function HeroAvatar({ initials }: { initials: string }) {
  return (
    <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ring-1 ring-inset ring-zinc-500/15">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 tracking-wide">
        {initials || '·'}
      </span>
    </div>
  );
}

interface HeroIconTileProps {
  icon: LucideIcon;
  tone?: 'neutral' | 'primary' | 'emerald' | 'sky' | 'amber';
}

const iconToneClasses: Record<NonNullable<HeroIconTileProps['tone']>, { bg: string; ring: string; icon: string }> = {
  neutral: { bg: 'bg-zinc-100 dark:bg-zinc-800', ring: 'ring-zinc-500/15', icon: 'text-zinc-600 dark:text-zinc-300' },
  primary: { bg: 'bg-primary/10', ring: 'ring-primary/20', icon: 'text-primary' },
  emerald: { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  sky: { bg: 'bg-sky-500/10', ring: 'ring-sky-500/20', icon: 'text-sky-600 dark:text-sky-400' },
  amber: { bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', icon: 'text-amber-600 dark:text-amber-400' },
};

export function HeroIconTile({ icon: Icon, tone = 'neutral' }: HeroIconTileProps) {
  const t = iconToneClasses[tone];
  return (
    <div className={`size-12 rounded-xl ${t.bg} flex items-center justify-center ring-1 ring-inset ${t.ring}`}>
      <Icon className={`size-5 ${t.icon}`} strokeWidth={2} />
    </div>
  );
}
