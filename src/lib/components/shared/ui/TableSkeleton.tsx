function Skeleton({ className }: { className: string }) {
  return <div className={`motion-safe:animate-pulse rounded-md bg-active ${className}`} />;
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
        <Skeleton className="h-[var(--lume-control-h-md)] w-56 shrink-0" />
        <Skeleton className="h-[var(--lume-control-h-md)] w-28 ml-auto shrink-0" />
      </div>

      {/* Table card */}
      <div className="rounded-xl overflow-hidden shadow-[inset_0_0_0_1px_var(--lume-line)]">
        {/* Header row */}
        <div className="flex items-center gap-6 px-4 py-3 border-b border-line">
          {HEADER_WIDTHS.map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>

        {/* Data rows */}
        {ROW_PATTERNS.map((cols, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-4 py-3.5 border-b border-line last:border-0"
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
