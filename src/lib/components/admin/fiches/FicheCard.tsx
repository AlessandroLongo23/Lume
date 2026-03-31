'use client';

import { BookOpen, Calendar } from 'lucide-react';
import type { Fiche } from '@/lib/types/Fiche';

interface FicheCardProps {
  fiche: Fiche;
}

export function FicheCard({ fiche }: FicheCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-500/25 rounded-lg p-6 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4 h-full">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{fiche.id}</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {fiche.client_id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(fiche.datetime).toLocaleString('it-IT')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 h-full">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{fiche.status}</span>
        </div>
      </div>
    </div>
  );
}
