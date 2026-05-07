'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';

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
    <div className="flex flex-row justify-between items-center w-full">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {totalItems === 0 ? (
          `Nessun ${labelPlural} trovato`
        ) : (
          <>
            Mostrando{' '}
            <span className="text-zinc-700 dark:text-zinc-300">{startIndex}-{endIndex}</span>
            {' '}di{' '}
            <span className="text-zinc-700 dark:text-zinc-300">{totalItems}</span>
            {' '}{labelPlural}
          </>
        )}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Tooltip label="Prima pagina">
            <Button variant="secondary" size="sm" iconOnly aria-label="Prima pagina" onClick={() => goToPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft />
            </Button>
          </Tooltip>
          <Tooltip label="Pagina precedente">
            <Button variant="secondary" size="sm" iconOnly aria-label="Pagina precedente" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft />
            </Button>
          </Tooltip>
          <span className="text-xs text-zinc-700 dark:text-zinc-300 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg">
            {currentPage} / {totalPages}
          </span>
          <Tooltip label="Pagina successiva">
            <Button variant="secondary" size="sm" iconOnly aria-label="Pagina successiva" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight />
            </Button>
          </Tooltip>
          <Tooltip label="Ultima pagina">
            <Button variant="secondary" size="sm" iconOnly aria-label="Ultima pagina" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
