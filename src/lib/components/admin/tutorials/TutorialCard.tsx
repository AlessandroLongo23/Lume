'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { Tutorial } from '@/lib/tutorials/types';
import { ComplexityBadge, ScopeChips } from './TutorialTags';

export function TutorialCard({ tutorial, completed }: { tutorial: Tutorial; completed: boolean }) {
  return (
    <Link
      href={`/admin/aiuto/${tutorial.slug}`}
      className="group flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-primary/40 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground">{tutorial.title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {completed && (
            <CheckCircle2
              className="size-5 text-emerald-600 dark:text-emerald-400"
              aria-label="Completato"
            />
          )}
          <ComplexityBadge complexity={tutorial.complexity} />
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-muted-foreground">{tutorial.summary}</p>

      <div className="mt-1 flex flex-wrap gap-1.5">
        <ScopeChips scopes={tutorial.scopes} />
      </div>
    </Link>
  );
}
