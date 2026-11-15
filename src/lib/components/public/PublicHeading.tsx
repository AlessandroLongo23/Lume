import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const SIZE = {
  // The page title: the salon's name, "Pagina non trovata".
  lg: 'text-headline sm:text-3xl leading-tight',
  // The title of a result card: confirmed, cancelled, your booking.
  md: 'text-xl',
} as const;

/**
 * Headings of the public booking pages (outside the admin, so not PageHeader):
 * one weight and tracking at two sizes, with an optional muted line under it.
 */
export function PublicHeading({
  as: Tag = 'h1',
  size = 'lg',
  subtitle,
  className,
  children,
}: {
  as?: 'h1' | 'h2';
  size?: keyof typeof SIZE;
  subtitle?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Tag className={cn(SIZE[size], 'font-medium tracking-tight text-[var(--lume-text)] text-balance')}>{children}</Tag>
      {subtitle && <p className="mt-2 text-sm text-[var(--lume-text-secondary)]">{subtitle}</p>}
    </div>
  );
}
