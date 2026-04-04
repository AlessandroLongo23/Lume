function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700/60 ${className}`} />;
}

const ROW_PATTERNS = [
  ['w-[18%]', 'w-[26%]', 'w-[16%]', 'w-[14%]', 'w-[10%]'],
  ['w-[22%]', 'w-[20%]', 'w-[18%]', 'w-[10%]', 'w-[13%]'],
  ['w-[14%]', 'w-[30%]', 'w-[14%]', 'w-[16%]', 'w-[8%]'],
  ['w-[20%]', 'w-[22%]', 'w-[20%]', 'w-[12%]', 'w-[11%]'],
  ['w-[16%]', 'w-[28%]', 'w-[12%]', 'w-[18%]', 'w-[9%]'],
];

const HEADER_WIDTHS = ['w-[16%]', 'w-[24%]', 'w-[16%]', 'w-[14%]', 'w-[10%]'];

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-56 shrink-0" />
        <Skeleton className="h-9 w-28 ml-auto shrink-0" />
      </div>

      {/* Table card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-6 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
          {HEADER_WIDTHS.map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>

        {/* Data rows */}
        {ROW_PATTERNS.map((cols, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
          >
            {cols.map((w, j) => (
              <Skeleton key={j} className={`h-4 ${w}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
