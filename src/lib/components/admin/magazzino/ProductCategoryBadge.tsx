'use client';

// ds-ignore: a category tinted with its own identity colour; Tag and DetailChip are neutral grey by design, so neither can show it
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';

interface ProductCategoryBadgeProps {
  category_id: string | null | undefined;
}

export function ProductCategoryBadge({ category_id }: ProductCategoryBadgeProps) {
  const categories = useProductCategoriesStore((s) => s.product_categories);
  const cat = category_id ? categories.find((c) => c.id === category_id) : null;

  if (!cat) return <span className="text-[var(--lume-text-muted)] text-xs">—</span>;

  const color = cat.color ?? DEFAULT_CATEGORY_COLOR;

  return (
    // Identity colour as a soft tint, mixed the same way as the calendar's
    // FicheBlock so it sits on any surface in both themes. The text mixes the
    // swatch towards the theme's text colour to stay readable.
    <span
      className="inline-flex items-center h-5 px-1.5 rounded-md text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
        color: `color-mix(in oklab, ${color} 65%, var(--lume-text))`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 28%, transparent)`,
      }}
    >
      {cat.name}
    </span>
  );
}
