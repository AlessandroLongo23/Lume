import type { ReactNode } from 'react';

/**
 * Headline figures as a row of big light numbers, each with a small label
 * under it, divided by hairlines. No boxes, no corner icons.
 */
export function StatRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 border-t border-line ${className}`}
    >
      {children}
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  /** A small mark before the label: a series dot or a direction arrow. */
  marker?: ReactNode;
  /** Negative figures read in the danger ink. */
  negative?: boolean;
  /** Secondary lines under the label (VAT-inclusive figure, trend). */
  children?: ReactNode;
}

export function Stat({ label, value, marker, negative = false, children }: StatProps) {
  return (
    <div className="min-w-0 py-5 pr-4 sm:pr-6 border-b border-line sm:border-b-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-line sm:[&:not(:first-child)]:pl-6">
      <p
        className={`tabular-nums text-xl min-[420px]:text-2xl sm:text-headline leading-tight font-normal tracking-tight truncate ${
          negative ? 'text-danger-strong' : 'text-[var(--lume-text)]'
        }`}
      >
        {value}
      </p>
      <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--lume-text-secondary)]">
        {marker}
        {label}
      </p>
      {children && <div className="mt-2 flex flex-col gap-1 text-xs text-[var(--lume-text-muted)]">{children}</div>}
    </div>
  );
}

/** Small coloured dot that ties a figure to its chart series. */
export function SeriesDot({ color }: { color: string }) {
  return <span className="size-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />;
}

/**
 * Change vs the comparison period: a coloured arrow carries good or bad,
 * the figure and the words stay in neutral ink.
 */
export function Trend({ value, higherIsWorse = false, suffix }: { value: number; higherIsWorse?: boolean; suffix?: string }) {
  const good = (value >= 0) !== higherIsWorse;
  const up = value >= 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={good ? 'text-success-strong' : 'text-danger-strong'}
        aria-label={good ? 'in meglio' : 'in peggio'}
      >
        {up ? '↑' : '↓'}
      </span>
      <span className="tabular-nums text-[var(--lume-text-secondary)]">
        {up ? '+' : '−'}
        {Math.abs(value).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
}
