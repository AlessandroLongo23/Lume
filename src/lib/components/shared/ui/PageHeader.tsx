import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Parent page, shown above the title (detail pages). */
  back?: { href: string; label: string };
  /** Small content beside the title: a status, a count. */
  meta?: ReactNode;
  /** Let a long title wrap onto more lines instead of truncating it. */
  wrap?: boolean;
}

/**
 * Title and one quiet line. Hierarchy comes from size and tight tracking,
 * not weight or an icon tile. Every page title in the admin uses it.
 */
export function PageHeader({ title, subtitle, actions, back, meta, wrap = false }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 self-start -ml-1 px-1 h-8 pointer-coarse:h-11 rounded-md text-sm text-[var(--lume-text-secondary)] hover:text-[var(--lume-text)] transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      {/* The actions share the title's row and centre on it; the subtitle runs
          full width below. Phones stack title, subtitle, actions: side by
          side, the actions (which never shrink) squeeze the title to nothing. */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-4 w-full">
        <div className="flex items-center gap-3 min-w-0 sm:self-center">
          <h1 className={`text-headline font-medium tracking-tight leading-tight text-[var(--lume-text)] ${wrap ? 'text-balance' : 'truncate'}`}>{title}</h1>
          {meta && <div className="shrink-0">{meta}</div>}
        </div>
        {actions && (
          <div className="flex flex-row flex-wrap items-center gap-2 max-sm:order-last max-sm:mt-4 sm:self-center">{actions}</div>
        )}
        {subtitle && <p className={`sm:col-span-2 text-sm text-[var(--lume-text-secondary)] mt-1.5 ${wrap ? 'text-pretty' : 'truncate'}`}>{subtitle}</p>}
      </div>
    </div>
  );
}
