'use client';

import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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

  const btnClass =
    'font-thin p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-zinc-900 transition-colors';

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
          <button onClick={() => goToPage(1)} disabled={currentPage === 1} className={btnClass} title="Prima pagina">
            <ChevronsLeft className="size-4" />
          </button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={btnClass} title="Pagina precedente">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-zinc-700 dark:text-zinc-300 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg">
            {currentPage} / {totalPages}
          </span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={btnClass} title="Pagina successiva">
            <ChevronRight className="size-4" />
          </button>
          <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className={btnClass} title="Ultima pagina">
            <ChevronsRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
