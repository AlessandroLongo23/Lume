'use client';

import { ReactNode } from 'react';

interface ChartTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

export function ChartTooltip({ visible, x, y, position = 'top', children }: ChartTooltipProps) {
  if (!visible) return null;

  const offset = 12;
  let translate = '';
  let style = '';
  let indicator = '';

  if (position === 'top') {
    translate = '-translate-x-1/2';
    style = `left: ${x}px; top: ${y - offset}px;`;
    indicator = 'left-1/2 bottom-0 translate-y-1.5 -translate-x-1.5 rotate-45';
  } else if (position === 'bottom') {
    translate = '-translate-x-1/2 translate-y-full';
    style = `left: ${x}px; top: ${y + offset}px;`;
    indicator = 'left-1/2 top-0 -translate-y-1.5 -translate-x-1.5 -rotate-[135deg]';
  } else if (position === 'left') {
    translate = '-translate-x-full';
    style = `left: ${x - offset}px; top: ${y}px;`;
    indicator = 'right-0 top-1/2 -translate-y-1.5 translate-x-1.5 -rotate-45';
  } else if (position === 'right') {
    translate = 'translate-x-1.5';
    style = `left: ${x + offset}px; top: ${y}px;`;
    indicator = 'left-0 top-1/2 -translate-y-1.5 -translate-x-1.5 rotate-[135deg]';
  }

  return (
    <div
      className={`${translate} absolute flex flex-col z-50 bg-card min-w-52 border border-border rounded-lg shadow-md pointer-events-none transform transition-all duration-100`}
      style={style as React.CSSProperties}
    >
      {children}
      <div
        className={`${indicator} absolute size-3 bg-card border-b border-r border-border transform`}
      />
    </div>
  );
}
