'use client';

import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';

interface ProductCategoryBadgeProps {
  category_id: string | null | undefined;
}

export function ProductCategoryBadge({ category_id }: ProductCategoryBadgeProps) {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const cat = category_id ? categories.find((c) => c.id === category_id) : null;

  if (!cat) return <span className="text-zinc-400 text-xs">—</span>;

  const color = cat.color ?? DEFAULT_CATEGORY_COLOR;

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
