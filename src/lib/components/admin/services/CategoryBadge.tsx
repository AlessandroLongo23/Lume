'use client';

import { useServiceCategoriesStore } from '@/lib/stores/service_categories';

interface CategoryBadgeProps {
  category_id: string;
}

export function CategoryBadge({ category_id }: CategoryBadgeProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const cat = categories.find((c) => c.id === category_id);

  if (!cat) return <span className="text-zinc-400 text-xs">—</span>;

  const color = cat.color ?? '#6366F1';

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{
        backgroundColor: `${color}1a`,
        color,
        borderColor: `${color}33`,
      }}
    >
      {cat.name}
    </span>
  );
}
