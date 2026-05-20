import { COMPLEXITY_LABELS, SCOPE_LABELS, type Complexity, type Scope } from '@/lib/tutorials/types';
import { cn } from '@/lib/utils';

/**
 * Complexity reads as a single badge with a monochrome indigo intensity ramp
 * (light → solid as difficulty rises), kept visually distinct from the neutral
 * grey scope tags. Shared by the hub card and the tutorial detail page.
 */
const COMPLEXITY_BADGE: Record<Complexity, string> = {
  base: 'bg-primary/10 text-primary',
  avanzato: 'bg-primary/20 text-primary',
  power: 'bg-primary text-white',
};

export function ComplexityBadge({
  complexity,
  className,
}: {
  complexity: Complexity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-semibold',
        COMPLEXITY_BADGE[complexity],
        className,
      )}
    >
      {COMPLEXITY_LABELS[complexity]}
    </span>
  );
}

export function ScopeChips({ scopes }: { scopes: Scope[] }) {
  return (
    <>
      {scopes.map((sc) => (
        <span
          key={sc}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {SCOPE_LABELS[sc]}
        </span>
      ))}
    </>
  );
}
