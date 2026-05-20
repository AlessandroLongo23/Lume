'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { CardComponentProps } from 'nextstepjs';
import { Button } from '@/lib/components/shared/ui/Button';
import { cn } from '@/lib/utils';
import type { LumeTourStep } from '@/lib/tutorials/types';

/**
 * Custom NextStep card rendered with Lume design tokens. NextStep portals this
 * to <body> and z-indexes it from `overlayZIndex` (default 999), so it sits
 * above modals/popovers — which the action-gated setup steps rely on.
 *
 * The per-step "hybrid" lives here: a `narrate` step shows the Avanti/Fine
 * primary button; an `action` step hides it (the tour advances when the user
 * performs the highlighted action) and offers a quiet "Salta" instead.
 */
export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const s = step as LumeTourStep;
  const mode = s.mode ?? 'narrate';
  const optional = s.optional ?? false;
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  // "Fill a field" steps: keep Avanti disabled until the watched input has a
  // value, then enable it so the user finishes typing and clicks Avanti to
  // advance (no auto-jump mid-typing; works under the click-locking overlay).
  const gate = s.advanceWhenFilled;
  const [gateFilled, setGateFilled] = useState(false);
  useEffect(() => {
    if (!gate) return; // non-gated steps don't read gateFilled, so no reset needed
    // Poll the watched input each frame rather than listening for 'input': some
    // fields (e.g. the search box) re-render and swap their DOM node as the user
    // types, which would orphan an attached listener. Re-querying is robust to
    // that, to late mounting, and to controlled-input re-renders. setState only
    // fires on an actual change, so this is quiet.
    let raf = 0;
    let last: boolean | null = null;
    const tick = () => {
      const el = document.querySelector(gate) as HTMLInputElement | null;
      const filled = !!el?.value?.trim();
      if (filled !== last) {
        last = filled;
        setGateFilled(filled);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gate, currentStep]);

  // narrate → enabled; optional field → enabled (with a "Salta" shortcut);
  // gated action → enabled once filled; other action → disabled (those advance
  // via navigation / a tour event, not the button).
  const advanceDisabled = optional ? false : gate ? !gateFilled : mode === 'action';

  return (
    <div
      className={cn(
        'relative w-[320px] max-w-[calc(100vw-2rem)] rounded-xl p-4',
        'border border-zinc-200 bg-white shadow-xl',
        'dark:border-zinc-800 dark:bg-zinc-900',
      )}
      role="dialog"
      aria-label={step.title}
    >
      {/* NextStep's arrow is a `fill="currentColor"` triangle — colour it to the
          card surface so it reads as a tail of the tooltip, not a black wedge. */}
      <span className="text-white dark:text-zinc-900">{arrow}</span>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {step.icon && <span className="shrink-0 text-primary">{step.icon}</span>}
          <h3 className="truncate text-sm font-semibold text-foreground">{step.title}</h3>
          {optional && (
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Facoltativo
            </span>
          )}
        </div>
        {skipTour && (
          <button
            type="button"
            onClick={skipTour}
            aria-label="Chiudi guida"
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.content}</div>

      {mode === 'action' && !gate && !optional && (
        <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          Completa l’azione evidenziata per continuare.
        </div>
      )}
      {gate && !gateFilled && (
        <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
          Compila il campo evidenziato per continuare.
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {currentStep + 1} / {totalSteps}
        </span>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="ghost" size="sm" leadingIcon={ArrowLeft} onClick={prevStep}>
              Indietro
            </Button>
          )}
          {optional && !isLast && (
            <Button variant="ghost" size="sm" onClick={nextStep}>
              Salta
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            trailingIcon={isLast ? Check : ArrowRight}
            onClick={nextStep}
            disabled={advanceDisabled}
          >
            {isLast ? 'Fine' : 'Avanti'}
          </Button>
        </div>
      </div>
    </div>
  );
}
