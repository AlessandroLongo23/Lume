import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsCard({ icon: Icon, title, description, rightSlot, children }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          </div>
          {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}
