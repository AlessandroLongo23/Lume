'use client';

import { useServiceCategoriesStore } from '@/lib/stores/service_categories';

interface CategoryBadgeProps {
  category_id: string;
}

const BADGE_COLORS = [
  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
];

function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

export function CategoryBadge({ category_id }: CategoryBadgeProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const cat = categories.find((c) => c.id === category_id);

  if (!cat) return <span className="text-zinc-400 text-xs">—</span>;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorFromId(category_id)}`}>
      {cat.name}
    </span>
  );
}
