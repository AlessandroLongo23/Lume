function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700/60 ${className}`} />;
}

const SPESE_ROW_PATTERNS = [
  ['w-[16%]', 'w-[30%]', 'w-[18%]', 'w-[14%]'],
  ['w-[14%]', 'w-[26%]', 'w-[20%]', 'w-[12%]'],
  ['w-[18%]', 'w-[28%]', 'w-[16%]', 'w-[16%]'],
  ['w-[12%]', 'w-[32%]', 'w-[18%]', 'w-[10%]'],
  ['w-[16%]', 'w-[24%]', 'w-[20%]', 'w-[14%]'],
];

export function BilancioSpeseSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Add button */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 shrink-0" />
      </div>

      {/* Table card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
        {/* Header row */}
        <div className="flex items-center gap-6 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
          {['w-[16%]', 'w-[28%]', 'w-[18%]', 'w-[14%]', 'w-[8%]'].map((w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          ))}
        </div>

        {/* Data rows */}
        {SPESE_ROW_PATTERNS.map((cols, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            {cols.map((w, j) => (
              <Skeleton key={j} className={`h-4 ${w}`} />
            ))}
            <Skeleton className="h-6 w-6 ml-auto shrink-0" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Skeleton className="h-8 w-64 self-end" />
    </div>
  );
}

const OBIETTIVI_FIELDS = ['w-[60%]', 'w-[55%]', 'w-[65%]', 'w-[50%]', 'w-[58%]'];

export function BilancioObiettiviSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
      {/* Left — form card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 pb-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72 mt-1" />
        </div>
        {OBIETTIVI_FIELDS.map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className={`h-3 ${OBIETTIVI_FIELDS[i]}`} />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        {/* Slider row */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-4 w-full rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg mt-2" />
      </div>

      {/* Right — calculator card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col gap-0">
        <div className="flex flex-col gap-1.5 pb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56 mt-1" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-t border-zinc-200 dark:border-zinc-800">
            <Skeleton className={`h-3 ${i === 4 ? 'w-40' : 'w-32'}`} />
            <Skeleton className={`h-${i === 4 ? '7 w-28' : '4 w-20'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BilancioSkeleton() {
  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
          >
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
            <Skeleton className="h-7 w-36 mt-3" />
          </div>
        ))}
      </div>

      {/* Chart + Tax Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    </>
  );
}
