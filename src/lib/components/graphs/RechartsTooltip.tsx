'use client';

import type { TooltipContentProps } from 'recharts';

type ValueFormatter = (value: number | string, name: string) => [string, string];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTooltipProps = TooltipContentProps<any, any>;

function TooltipContent({ active, payload, label, valueFormatter }: AnyTooltipProps & { valueFormatter?: ValueFormatter }) {
  if (!active || !payload?.length) return null;

  const isMultiSeries = payload.length > 1;

  return (
    <div className="surface-float px-3 py-2 min-w-25">
      {label != null && <span className="block mb-1 text-2xs text-[var(--lume-text-muted)]">{String(label)}</span>}
      {payload.map((item: { name?: unknown; value?: unknown; color?: string }, i: number) => {
        const rawValue = item.value != null ? item.value as number | string : '';
        const rawName = item.name != null ? String(item.name) : '';
        const [formattedValue, formattedName] = valueFormatter
          ? valueFormatter(rawValue, rawName)
          : [String(rawValue), rawName];

        return (
          <div key={i} className={`flex items-center justify-between gap-2 ${i > 0 ? 'mt-1' : ''}`}>
            <div className="flex items-center gap-1.5 text-xs text-[var(--lume-text-secondary)]">
              {isMultiSeries && item.color && (
                <span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden />
              )}
              {formattedName && <span>{formattedName}</span>}
            </div>
            <span className="tabular-nums text-compact font-medium text-[var(--lume-text)]">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}

export function makeRechartsTooltip(valueFormatter?: ValueFormatter) {
  return function RechartsTooltip(props: AnyTooltipProps) {
    return <TooltipContent {...props} valueFormatter={valueFormatter} />;
  };
}
