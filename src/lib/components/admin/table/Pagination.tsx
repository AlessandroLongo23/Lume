'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';

interface PaginationProps {
  currentPage: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
  labelPlural?: string;
}

export function Pagination({
  currentPage,
  onPageChange,
  totalItems,
  itemsPerPage = 25,
  labelPlural = 'elementi',
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      onPageChange(totalPages);
    } else if (currentPage < 1) {
      onPageChange(1);
    }
  }, [totalPages, currentPage, onPageChange]);

  return (
    <div className="flex flex-row justify-between items-center gap-3 w-full min-h-[var(--lume-control-h-md)]">
      <p className="text-xs text-[var(--lume-text-secondary)] min-w-0">
        {totalItems === 0 ? (
          `Nessun ${labelPlural} trovato`
        ) : (
          <>
            <span className="tabular-nums text-[var(--lume-text)]">{startIndex}–{endIndex}</span>
            {' '}di{' '}
            <span className="tabular-nums text-[var(--lume-text)]">{totalItems}</span>
            {' '}{labelPlural}
          </>
        )}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Paginazione" className="flex items-center gap-0.5">
          <Button variant="ghost" size="md" iconOnly aria-label="Prima pagina" onClick={() => goToPage(1)} disabled={currentPage === 1}>
            <ChevronsLeft />
          </Button>
          <Button variant="ghost" size="md" iconOnly aria-label="Pagina precedente" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft />
          </Button>
          <span className="px-2 tabular-nums text-xs text-[var(--lume-text-secondary)] whitespace-nowrap" aria-live="polite">
            <span className="text-[var(--lume-text)]">{currentPage}</span> / {totalPages}
          </span>
          <Button variant="ghost" size="md" iconOnly aria-label="Pagina successiva" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="md" iconOnly aria-label="Ultima pagina" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
            <ChevronsRight />
          </Button>
        </nav>
      )}
    </div>
  );
}
