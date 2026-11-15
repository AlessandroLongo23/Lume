'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import type { CardComponentProps } from 'nextstepjs';
import { Button } from '@/lib/components/shared/ui/Button';
import { Tag } from '@/lib/components/shared/ui/Tag';
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
      // The gate is an input, or a wrapper around a composite field (date + time):
      // a wrapper counts as filled once every input inside it has a value.
      const el = document.querySelector(gate);
      const inputs = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
        ? [el]
        : Array.from(el?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea') ?? []);
      const filled = inputs.length > 0 && inputs.every((i) => !!i.value.trim());
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
        // The shared floating surface; NextStep positions and layers the card.
        'surface-float relative w-80 max-w-[calc(100vw-2rem)] rounded-xl p-4',
      )}
      role="dialog"
      aria-label={step.title}
    >
      {/* NextStep's arrow is a `fill="currentColor"` triangle — colour it to the
          card surface so it reads as a tail of the tooltip, not a black wedge. */}
      <span className="text-[var(--lume-surface-raised)]">{arrow}</span>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {step.icon && <span className="shrink-0 text-[var(--lume-text-secondary)]">{step.icon}</span>}
          <h3 className="truncate text-sm font-medium text-[var(--lume-text)]">{step.title}</h3>
          {optional && (
            <Tag className="shrink-0">Facoltativo</Tag>
          )}
        </div>
        {skipTour && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={skipTour}
            aria-label="Chiudi guida"
            className="-mr-1.5 -mt-1.5"
          >
            <X />
          </Button>
        )}
      </div>

      <div className="mt-2 text-sm leading-relaxed text-[var(--lume-text-secondary)]">{step.content}</div>

      {mode === 'action' && !gate && !optional && (
        <div className="mt-3 rounded-lg bg-hover px-3 py-2 text-xs font-medium text-[var(--lume-text)]">
          Completa l’azione evidenziata per continuare.
        </div>
      )}
      {gate && !gateFilled && (
        <div className="mt-3 rounded-lg bg-hover px-3 py-2 text-xs font-medium text-[var(--lume-text)]">
          Compila il campo evidenziato per continuare.
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-[var(--lume-text-muted)]">
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
