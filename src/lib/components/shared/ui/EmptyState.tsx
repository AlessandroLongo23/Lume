'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';

interface EmptyStateAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

/**
 * A quiet tinted field with a small framed icon, one line of title and the
 * next step as a button. PRODUCT.md: no empty state without a "do this next".
 */
export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 rounded-xl bg-hover text-center">
      <span className="flex items-center justify-center size-11 mb-5 rounded-lg bg-[var(--lume-surface-raised)] shadow-[inset_0_0_0_1px_var(--lume-edge)]">
        <Icon strokeWidth={1.5} className="size-5 text-[var(--lume-text-secondary)]" />
      </span>
      <h2 className="text-lg font-medium text-[var(--lume-text)] mb-1.5">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--lume-text-secondary)] max-w-sm mb-6 text-pretty">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-row flex-wrap items-center justify-center gap-2">
          {secondaryAction && (
            <Button variant="secondary" leadingIcon={secondaryAction.icon} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button variant="primary" leadingIcon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
