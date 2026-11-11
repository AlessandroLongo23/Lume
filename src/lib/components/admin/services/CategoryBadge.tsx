'use client';

// ds-ignore: a category tinted with its own identity colour; Tag and DetailChip are neutral grey by design, so neither can show it
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';

interface CategoryBadgeProps {
  category_id: string | null;
}

export function CategoryBadge({ category_id }: CategoryBadgeProps) {
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const cat = categories.find((c) => c.id === category_id);

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
