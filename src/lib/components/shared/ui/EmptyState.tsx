'use client';

import type { LucideIcon } from 'lucide-react';

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

export function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 bg-background rounded-lg border border-dashed border-border">
      <Icon strokeWidth={1} className="size-20 text-muted-foreground/60 mb-4" />
      <h2 className="text-xl font-semibold text-foreground mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-row items-center gap-3">
          {secondaryAction && (
            <button className="btn-secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.icon && <secondaryAction.icon className="size-4" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}
          {action && (
            <button className="btn-primary" onClick={action.onClick}>
              {action.icon && <action.icon className="size-4" />}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
