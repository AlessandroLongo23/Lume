'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <Fragment key={`${idx}-${item.label}`}>
            {idx > 0 && (
              <ChevronRight className="size-3.5 text-zinc-400 dark:text-zinc-600 shrink-0" />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 truncate transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'text-zinc-900 dark:text-zinc-100 font-medium truncate'
                    : 'text-zinc-500 dark:text-zinc-400 truncate'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
