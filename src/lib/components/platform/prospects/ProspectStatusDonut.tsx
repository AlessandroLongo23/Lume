'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import {
  Prospect,
  PROSPECT_STATUSES,
  STATUS_LABEL,
  type ProspectStatus,
} from '@/lib/types/Prospect';
import { cn } from '@/lib/utils';
import { ProspectStatusChip } from './ProspectStatusChip';

const readVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Status → CSS variable used for that slice's color. Chart-* vars are bridged
// to the Lume palette (see globals.css) and adapt to dark/light mode.
const STATUS_VAR: Record<ProspectStatus, string> = {
  not_contacted:      '--muted-foreground',
  no_answer:          '--color-neutral-400',
  callback_scheduled: '--chart-4',
  not_interested:     '--chart-5',
  no_pc:              '--color-danger-400',
  interested:         '--chart-1',
  materials_sent:     '--chart-2',
  signed_up:          '--chart-3',
};

interface ProspectStatusDonutProps {
  prospects:        Prospect[];
  activeStatuses:   ProspectStatus[];
  onToggleStatus:   (s: ProspectStatus) => void;
  className?:       string;
}

export function ProspectStatusDonut({
  prospects,
  activeStatuses,
  onToggleStatus,
  className,
}: ProspectStatusDonutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const stats = useMemo(() => Prospect.computeStats(prospects), [prospects]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const size = 200;
    const radius = size / 2;
    const innerRadius = radius * 0.65;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .attr('viewBox', `${-radius} ${-radius} ${size} ${size}`)
      .attr('aria-label', 'Distribuzione stato prospect');

    const data = PROSPECT_STATUSES.map((s) => ({
      status: s,
      count:  stats.byStatus[s],
    }));

    if (stats.total === 0) {
      // Empty ring placeholder
      svg.append('circle')
        .attr('r', radius - 4)
        .attr('fill', 'none')
        .attr('stroke', readVar('--border') || '#e4e4e7')
        .attr('stroke-width', radius - innerRadius)
        .attr('stroke-dasharray', '4 4');

      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '14px')
        .attr('fill', readVar('--muted-foreground') || '#71717a')
        .text('Nessun dato');
      return;
    }

    const pie = d3.pie<{ status: ProspectStatus; count: number }>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.012);

    const arc = d3.arc<d3.PieArcDatum<{ status: ProspectStatus; count: number }>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 2)
      .cornerRadius(2);

    const slices = svg.selectAll('path')
      .data(pie(data.filter((d) => d.count > 0)))
      .enter()
      .append('path')
      .attr('d', arc as never)
      .attr('fill', (d) => readVar(STATUS_VAR[d.data.status]) || '#71717a')
      .attr('opacity', (d) => activeStatuses.length === 0 || activeStatuses.includes(d.data.status) ? 1 : 0.25)
      .attr('cursor', 'pointer')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('aria-label', (d) => `${STATUS_LABEL[d.data.status]}: ${d.data.count}`);

    // Tooltip
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'pointer-events-none absolute hidden z-tooltip rounded-md border border-border bg-popover text-popover-foreground text-xs px-2.5 py-1.5 shadow-lg')
      .style('top', '0px')
      .style('left', '0px');

    slices
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 2).attr('stroke', readVar('--background'));
        const containerRect = container.getBoundingClientRect();
        const pct = stats.total > 0 ? (d.data.count / stats.total) * 100 : 0;
        tooltip
          .classed('hidden', false)
          .html(`<div class="font-medium">${STATUS_LABEL[d.data.status]}</div><div class="text-muted-foreground tabular-nums">${d.data.count} · ${pct.toFixed(0)}%</div>`)
          .style('top',  `${(event as MouseEvent).clientY - containerRect.top + 12}px`)
          .style('left', `${(event as MouseEvent).clientX - containerRect.left + 12}px`);
      })
      .on('mousemove', function (event) {
        const containerRect = container.getBoundingClientRect();
        tooltip
          .style('top',  `${(event as MouseEvent).clientY - containerRect.top + 12}px`)
          .style('left', `${(event as MouseEvent).clientX - containerRect.left + 12}px`);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('opacity', (d) => {
            const dat = d as d3.PieArcDatum<{ status: ProspectStatus; count: number }>;
            return activeStatuses.length === 0 || activeStatuses.includes(dat.data.status) ? 1 : 0.25;
          })
          .attr('stroke-width', 0);
        tooltip.classed('hidden', true);
      })
      .on('click', (_event, d) => onToggleStatus(d.data.status))
      .on('keydown', function (event, d) {
        const e = event as KeyboardEvent;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleStatus(d.data.status);
        }
      });

    // Center label: total
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', -6)
      .attr('font-size', '24px')
      .attr('font-weight', 600)
      .attr('fill', readVar('--foreground'))
      .style('font-variant-numeric', 'tabular-nums')
      .text(stats.total);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', 14)
      .attr('font-size', '11px')
      .attr('fill', readVar('--muted-foreground'))
      .text('prospect');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects, stats, activeStatuses, resolvedTheme]);

  const fmtPct = (v: number | null) => v === null ? '—' : `${(v * 100).toFixed(0)}%`;

  return (
    <div className={cn('flex flex-col md:flex-row items-center gap-6', className)}>
      <div ref={containerRef} className="relative shrink-0" />

      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <KpiCard label="Tasso di risposta" value={fmtPct(stats.answerRate)}
                 sub={`${stats.reached} su ${stats.called} chiamati`} />
        <KpiCard label="Tasso di interesse" value={fmtPct(stats.interestedRate)}
                 sub={`${stats.positive} su ${stats.reached} raggiunti`} />
        <KpiCard label="Materiali inviati"  value={String(stats.sent)}
                 sub={stats.reached > 0 ? `${fmtPct(stats.sentRate)} dei raggiunti` : '—'} />
      </div>

      {/* Inline legend (clickable) — kept compact under the KPI on small screens */}
      <div className="md:hidden flex flex-wrap gap-1.5 w-full">
        {PROSPECT_STATUSES.filter((s) => stats.byStatus[s] > 0).map((s) => (
          <button
            key={s}
            onClick={() => onToggleStatus(s)}
            className="inline-flex items-center gap-1.5 text-xs"
          >
            <ProspectStatusChip status={s} size="xs" />
            <span className="tabular-nums text-muted-foreground">{stats.byStatus[s]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}
