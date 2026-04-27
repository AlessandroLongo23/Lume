import type { ReactNode, ElementType } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ElementType;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-4 w-full">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <span className="flex items-center justify-center shrink-0 size-12 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <Icon className="size-5 text-zinc-900 dark:text-zinc-50" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight leading-tight text-zinc-900 dark:text-zinc-50 truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm font-normal text-zinc-500 dark:text-zinc-400 mt-1.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-row items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
