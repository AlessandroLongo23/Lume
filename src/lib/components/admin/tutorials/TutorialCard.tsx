'use client';

import Link from 'next/link';
import { CheckCircle2, Clock3 } from 'lucide-react';
import type { Tutorial } from '@/lib/tutorials/types';
import { ComplexityBadge, ScopeChips } from './TutorialTags';

export function TutorialCard({ tutorial, completed }: { tutorial: Tutorial; completed: boolean }) {
  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-[var(--lume-text)]">{tutorial.title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          {completed && !tutorial.comingSoon && (
            <CheckCircle2
              className="size-5 text-success-strong"
              aria-label="Completato"
            />
          )}
          {tutorial.comingSoon ? (
            <span className="inline-flex items-center gap-1 h-6 text-xs font-medium text-[var(--lume-text-secondary)]">
              <Clock3 className="size-3.5" aria-hidden="true" />
              In arrivo
            </span>
          ) : (
            <ComplexityBadge complexity={tutorial.complexity} />
          )}
        </div>
      </div>

      <p className="line-clamp-3 text-sm text-[var(--lume-text-secondary)]">{tutorial.summary}</p>

      <div className="mt-1 flex flex-wrap gap-1.5">
        <ScopeChips scopes={tutorial.scopes} />
      </div>
    </>
  );

  if (tutorial.comingSoon) {
    return (
      <div
        aria-disabled="true"
        className="flex cursor-default flex-col gap-2 rounded-xl border border-dashed border-[var(--lume-border)] p-4 opacity-75"
      >
        {cardBody}
      </div>
    );
  }

  return (
    <Link
      href={`/admin/aiuto/${tutorial.slug}`}
      className="group surface-card card-interactive flex flex-col gap-2 p-4"
    >
      {cardBody}
    </Link>
  );
}
