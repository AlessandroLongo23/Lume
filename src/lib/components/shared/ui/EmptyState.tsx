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
    <div className="flex flex-col items-center justify-center p-16 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
      <Icon strokeWidth={1} className="size-20 text-zinc-300 dark:text-zinc-600 mb-4" />
      <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-xs mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-row items-center gap-3">
          {secondaryAction && (
            <button
              className="flex flex-row items-center justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-300 dark:border-zinc-600"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon && <secondaryAction.icon className="size-4" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}
          {action && (
            <button
              className="flex flex-row items-center justify-center px-4 py-2 gap-2 text-sm font-thin transition-all bg-black hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-lg border border-zinc-500/25"
              onClick={action.onClick}
            >
              {action.icon && <action.icon className="size-4" />}
              <span>{action.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
