'use client';

import type { TooltipContentProps } from 'recharts';

type ValueFormatter = (value: number | string, name: string) => [string, string];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTooltipProps = TooltipContentProps<any, any>;

const tooltipStyle: React.CSSProperties = {
  background: 'var(--lume-surface-raised)',
  border: '1px solid var(--lume-border)',
  borderRadius: 8,
  padding: '8px 12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  minWidth: 100,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--lume-text-muted)',
  marginBottom: 4,
  display: 'block',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  justifyContent: 'space-between',
};

const nameStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  color: 'var(--lume-text-muted)',
};

const valueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--lume-text)',
  fontVariantNumeric: 'tabular-nums',
};

function TooltipContent({ active, payload, label, valueFormatter }: AnyTooltipProps & { valueFormatter?: ValueFormatter }) {
  if (!active || !payload?.length) return null;

  const isMultiSeries = payload.length > 1;

  return (
    <div style={tooltipStyle}>
      {label != null && <span style={labelStyle}>{String(label)}</span>}
      {payload.map((item: { name?: unknown; value?: unknown; color?: string }, i: number) => {
        const rawValue = item.value != null ? item.value as number | string : '';
        const rawName = item.name != null ? String(item.name) : '';
        const [formattedValue, formattedName] = valueFormatter
          ? valueFormatter(rawValue, rawName)
          : [String(rawValue), rawName];

        return (
          <div key={i} style={{ ...rowStyle, marginTop: i > 0 ? 4 : 0 }}>
            <div style={nameStyle}>
              {isMultiSeries && item.color && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: item.color, flexShrink: 0, display: 'inline-block',
                }} />
              )}
              {formattedName && <span>{formattedName}</span>}
            </div>
            <span style={valueStyle}>{formattedValue}</span>
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
