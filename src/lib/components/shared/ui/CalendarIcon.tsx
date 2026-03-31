'use client';

import { formatDateString } from '@/lib/utils/date';

interface CalendarIconProps {
  date: Date;
}

export function CalendarIcon({ date }: CalendarIconProps) {
  return (
    <div className="flex flex-row items-center gap-2">
      <div className="flex flex-col border border-zinc-500/25 rounded-md justify-between items-center w-16 h-16">
        <span className="text-xs font-medium bg-zinc-200 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-500/25 w-full text-center py-1">
          {formatDateString(date, 'MMM')}
        </span>
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 py-1">
          {formatDateString(date, 'd')}
        </span>
      </div>
    </div>
  );
}
