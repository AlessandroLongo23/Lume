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
import { ProspectStatusChip } from './ProspectStatusChip';
import { Button } from '@/lib/components/shared/ui/Button';
import { StatRow, Stat } from '@/lib/components/shared/ui/StatRow';

const readVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Status → CSS variable used for that slice's color. The --lume-series-*
// tokens (semantic.css) adapt to dark/light mode.
const STATUS_VAR: Record<ProspectStatus, string> = {
  not_contacted:      '--lume-text-muted',
  no_answer:          '--color-neutral-400', // ds-ignore: a grey slice beside text-muted, the same step in both themes
  callback_scheduled: '--lume-series-4',
  not_interested:     '--lume-series-5',
  no_pc:              '--color-danger-400', // ds-ignore: a red slice apart from series 5, the same step in both themes
  interested:         '--lume-series-1',
  materials_sent:     '--lume-series-2',
  signed_up:          '--lume-series-3',
};

interface ProspectStatusDonutProps {
  prospects:        Prospect[];
  activeStatuses:   ProspectStatus[];
  onToggleStatus:   (s: ProspectStatus) => void;
}

export function ProspectStatusDonut({
  prospects,
  activeStatuses,
  onToggleStatus,
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
        .attr('stroke', readVar('--lume-border') || '#e4e4e7')
        .attr('stroke-width', radius - innerRadius)
        .attr('stroke-dasharray', '4 4');

      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '14px')
        .attr('fill', readVar('--lume-text-muted') || '#71717a')
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

    // Tooltip: appended to <body> and fixed to the pointer, the d3 equivalent
    // of <Portal>, so no ancestor's overflow or stacking context can trap it.
    const tooltip = d3.select(document.body)
      .append('div')
      .attr('class', 'surface-float pointer-events-none fixed hidden z-tooltip text-xs px-2.5 py-1.5')
      .style('top', '0px')
      .style('left', '0px');

    slices
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 1).attr('stroke-width', 2).attr('stroke', readVar('--lume-bg'));
        const pct = stats.total > 0 ? (d.data.count / stats.total) * 100 : 0;
        tooltip
          .classed('hidden', false)
          .html(`<div class="font-medium">${STATUS_LABEL[d.data.status]}</div><div class="tabular-nums text-[var(--lume-text-secondary)]">${d.data.count} · ${pct.toFixed(0)}%</div>`)
          .style('top',  `${(event as MouseEvent).clientY + 12}px`)
          .style('left', `${(event as MouseEvent).clientX + 12}px`);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top',  `${(event as MouseEvent).clientY + 12}px`)
          .style('left', `${(event as MouseEvent).clientX + 12}px`);
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
      .attr('font-weight', 500)
      .attr('fill', readVar('--lume-text'))
      .style('font-variant-numeric', 'tabular-nums')
      .text(stats.total);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', 14)
      .attr('font-size', '11px')
      .attr('fill', readVar('--lume-text-muted'))
      .text('prospect');

    return () => { tooltip.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects, stats, activeStatuses, resolvedTheme]);

  const fmtPct = (v: number | null) => v === null ? '—' : `${(v * 100).toFixed(0)}%`;

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div ref={containerRef} className="relative shrink-0" />

      <StatRow className="flex-1 min-w-0 w-full sm:grid-cols-3">
        <Stat label="Tasso di risposta" value={fmtPct(stats.answerRate)}>
          {`${stats.reached} su ${stats.called} chiamati`}
        </Stat>
        <Stat label="Tasso di interesse" value={fmtPct(stats.interestedRate)}>
          {`${stats.positive} su ${stats.reached} raggiunti`}
        </Stat>
        <Stat label="Materiali inviati" value={String(stats.sent)}>
          {stats.reached > 0 ? `${fmtPct(stats.sentRate)} dei raggiunti` : '—'}
        </Stat>
      </StatRow>

      {/* Inline legend (clickable) — kept compact under the KPI on small screens */}
      <div className="md:hidden flex flex-wrap gap-1.5 w-full">
        {PROSPECT_STATUSES.filter((s) => stats.byStatus[s] > 0).map((s) => (
          <Button key={s} variant="ghost" size="sm" pressed={activeStatuses.includes(s)} onClick={() => onToggleStatus(s)} className="h-11 px-2">
            <ProspectStatusChip status={s} size="xs" />
            <span className="tabular-nums text-[var(--lume-text-secondary)]">{stats.byStatus[s]}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
