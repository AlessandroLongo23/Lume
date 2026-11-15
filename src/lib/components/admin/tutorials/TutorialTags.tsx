import { COMPLEXITY_LABELS, SCOPE_LABELS, type Complexity, type Scope } from '@/lib/tutorials/types';
import { cn } from '@/lib/utils';
import { DetailChip } from '@/lib/components/shared/ui/detail/DetailChip';

/**
 * Complexity reads as a single badge on a neutral intensity ramp (fainter →
 * stronger fill as difficulty rises). Indigo is kept for actions, so the
 * badge stays graphite. Shared by the hub card and the tutorial detail page.
 */
const COMPLEXITY_BADGE: Record<Complexity, string> = {
  base: 'bg-hover text-[var(--lume-text-secondary)]',
  avanzato: 'bg-active text-[var(--lume-text)]',
  power: 'bg-strong text-[var(--lume-text)]',
};

export function ComplexityBadge({ complexity }: { complexity: Complexity }) {
  return (
    <span className={cn('rounded-md px-2 h-6 inline-flex items-center text-xs font-medium', COMPLEXITY_BADGE[complexity])}>
      {COMPLEXITY_LABELS[complexity]}
    </span>
  );
}

export function ScopeChips({ scopes }: { scopes: Scope[] }) {
  return (
    <>
      {scopes.map((sc) => (
        <DetailChip key={sc}>{SCOPE_LABELS[sc]}</DetailChip>
      ))}
    </>
  );
}
