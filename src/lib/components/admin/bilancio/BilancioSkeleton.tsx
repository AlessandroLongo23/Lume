function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700/60 ${className}`} />;
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
