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
      <div className="flex items-center gap-3">
        {Icon && <Icon className="size-6 text-zinc-900 dark:text-zinc-50 shrink-0" />}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-row items-center gap-4">{actions}</div>}
    </div>
  );
}
