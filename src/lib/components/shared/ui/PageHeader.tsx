import type { ReactNode, ElementType } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ElementType;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-row items-start justify-between gap-4 w-full">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="flex items-center h-8 shrink-0">
            <Icon className="size-6 text-zinc-900 dark:text-zinc-50" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-8 text-zinc-900 dark:text-zinc-50">{title}</h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-row items-center gap-4 h-8">{actions}</div>}
    </div>
  );
}
