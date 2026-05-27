'use client';

import Link from 'next/link';
import { CheckCircle2, Clock3 } from 'lucide-react';
import type { Tutorial } from '@/lib/tutorials/types';
import { ComplexityBadge, ScopeChips } from './TutorialTags';

export function TutorialCard({ tutorial, completed }: { tutorial: Tutorial; completed: boolean }) {
  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground">{tutorial.title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {completed && !tutorial.comingSoon && (
            <CheckCircle2
              className="size-5 text-emerald-600 dark:text-emerald-400"
              aria-label="Completato"
            />
          )}
          {tutorial.comingSoon ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <Clock3 className="size-3.5" aria-hidden="true" />
              In arrivo
            </span>
          ) : (
            <ComplexityBadge complexity={tutorial.complexity} />
          )}
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-muted-foreground">{tutorial.summary}</p>

      <div className="mt-1 flex flex-wrap gap-1.5">
        <ScopeChips scopes={tutorial.scopes} />
      </div>
    </>
  );

  if (tutorial.comingSoon) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-default flex-col gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-4 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/40"
      >
        {cardBody}
      </div>
    );
  }

  return (
    <Link
      href={`/admin/aiuto/${tutorial.slug}`}
      className="group flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-primary/40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
    >
      {cardBody}
    </Link>
  );
}
