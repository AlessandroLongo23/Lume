'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Equal, ArrowUp, ArrowDown } from 'lucide-react';
import { useStatsStore } from '@/lib/stores/stats';
import { useProductsStore } from '@/lib/stores/products';
import { formatCurrency } from '@/lib/utils/format';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { designSystem } from '@/lib/const/appearance';
import { ChartTooltip } from './ChartTooltip';
import { StackedAreaChart } from './StackedAreaChart';

interface TooltipData {
  title: string;
  value: number;
  change: number;
  x: number;
  y: number;
}

interface StackedTooltipData {
  month: string;
  details: { product: string; earnings: number; color: string; isHighlighted: boolean }[];
  totalEarnings: number;
  x: number;
  y: number;
}

export function EarningsGraph() {
  const { theme } = useTheme();
  const earningsByMonth = useStatsStore((s) => s.earningsByMonth);
  const filterType = useStatsStore((s) => s.filterType);
  const filterId = useStatsStore((s) => s.filterId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const products = useProductsStore((s) => s.products);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData>({ title: '', value: 0, change: 0, x: 0, y: 0 });
  const [stackedTooltipData, setStackedTooltipData] = useState<StackedTooltipData>({ month: '', details: [], totalEarnings: 0, x: 0, y: 0 });

  const useStackedArea = filterType === 'product' && !filterId;

  const averageMonthlyEarnings = useMemo(() => {
    if (!earningsByMonth.length) return 0;
    return earningsByMonth.reduce((sum, item) => sum + item.earnings, 0) / earningsByMonth.length;
  }, [earningsByMonth]);

  const stackedAreaData = useMemo(() => {
    if (!useStackedArea) return [];
    // Without per-product breakdown data we return an empty array
    // A full implementation would need earnings broken down by product per month
    return [];
  }, [useStackedArea]);

  useEffect(() => {
    if (useStackedArea || !canvasContainerRef.current || !earningsByMonth.length) return;

    const container = canvasContainerRef.current;
    d3.select(container).selectAll('*').remove();

    const containerWidth = container.getBoundingClientRect().width || 600;
    const height = 300;
    const margin = { top: 10, right: 10, bottom: 30, left: 70 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const isDark = theme === 'dark';
    const gridColor = isDark ? designSystem.colors.chart.grid.dark : designSystem.colors.chart.grid.light;
    const avgLineColor = isDark ? designSystem.colors.chart.avgLine.dark : designSystem.colors.chart.avgLine.light;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .style('overflow', 'visible');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const months = earningsByMonth.map((d) => d.month);
    const xScale = d3.scalePoint().domain(months).range([0, chartWidth]).padding(0.5);
    const maxVal = d3.max(earningsByMonth, (d) => d.earnings) ?? 0;
    const yScale = d3.scaleLinear().domain([0, maxVal]).nice().range([chartHeight, 0]);

    // Avg line dashed
    const avg = averageMonthlyEarnings;
    if (avg > 0) {
      g.append('line')
        .attr('x1', 0).attr('x2', chartWidth)
        .attr('y1', yScale(avg)).attr('y2', yScale(avg))
        .attr('stroke', avgLineColor)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
    }

    // Area fill
    const area = d3
      .area<{ month: string; earnings: number }>()
      .x((d) => xScale(d.month) ?? 0)
      .y0(chartHeight)
      .y1((d) => yScale(d.earnings))
      .curve(d3.curveCatmullRom);

    g.append('path')
      .datum(earningsByMonth)
      .attr('fill', 'rgba(34, 197, 94, 0.15)')
      .attr('d', area);

    // Line
    const line = d3
      .line<{ month: string; earnings: number }>()
      .x((d) => xScale(d.month) ?? 0)
      .y((d) => yScale(d.earnings))
      .curve(d3.curveCatmullRom);

    g.append('path')
      .datum(earningsByMonth)
      .attr('fill', 'none')
      .attr('stroke', designSystem.colors.primary.green)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Points
    g.selectAll('circle')
      .data(earningsByMonth)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.month) ?? 0)
      .attr('cy', (d) => yScale(d.earnings))
      .attr('r', 4)
      .attr('fill', designSystem.colors.primary.green)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5)
      .on('mouseover', function (event, d) {
        d3.select(this).attr('r', 6);
        const index = earningsByMonth.findIndex((m) => m.month === d.month);
        const prev = index > 0 ? earningsByMonth[index - 1].earnings : d.earnings;
        setTooltipData({
          title: d.month,
          value: d.earnings,
          change: d.earnings - prev,
          x: (xScale(d.month) ?? 0) + margin.left,
          y: yScale(d.earnings) - 116,
        });
        setTooltipVisible(true);
      })
      .on('mouseout', function () {
        d3.select(this).attr('r', 4);
        setTooltipVisible(false);
      });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', designSystem.colors.chart.text)
      .attr('font-size', '11px');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => formatCurrency(+d)).tickSize(-chartWidth))
      .selectAll('line')
      .attr('stroke', gridColor)
      .attr('stroke-opacity', 0.5);

    g.selectAll('.domain').attr('stroke', gridColor);
    g.selectAll('text').attr('fill', designSystem.colors.chart.text).attr('font-size', '11px');
  }, [earningsByMonth, theme, useStackedArea, averageMonthlyEarnings]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStackedHover = (event: { month: string; details: any[]; x: number; y: number }) => {
    const total = event.details.reduce((s, d) => s + d.earnings, 0);
    setStackedTooltipData({ ...event, totalEarnings: total, y: event.y - 70 });
    setTooltipVisible(true);
  };

  return (
    <div className="relative flex flex-col h-full items-center">
      {/* Average badge */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/90 dark:bg-[#121212] border border-[#E5E7EB] dark:border-[#374151] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5" style={{ backgroundImage: 'linear-gradient(to right, #D1D5DB 50%, transparent 50%)', backgroundSize: '6px 100%', backgroundRepeat: 'repeat-x' }} />
          <span className="text-xs font-thin text-[#6B7280]">Average</span>
        </div>
        <span className="text-sm font-semibold text-[#111827] dark:text-white">
          {formatCurrency(averageMonthlyEarnings)}
        </span>
      </div>

      {useStackedArea ? (
        <div className="w-full h-full">
          <StackedAreaChart data={stackedAreaData} height={300} tension={0.4} onHover={handleStackedHover} onMouseOut={() => setTooltipVisible(false)} />
        </div>
      ) : (
        <div ref={canvasContainerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
      )}

      <ChartTooltip
        visible={tooltipVisible}
        x={useStackedArea ? stackedTooltipData.x : tooltipData.x}
        y={useStackedArea ? stackedTooltipData.y : tooltipData.y}
        position="top"
      >
        <div className="p-3">
          <p className="text-sm font-thin text-[#111827] dark:text-white">
            {useStackedArea ? stackedTooltipData.month : tooltipData.title}
          </p>
        </div>
        <hr className="w-full border-[#E5E7EB] dark:border-[#374151]" />
        <div className="flex flex-col gap-2 p-3">
          {useStackedArea && stackedTooltipData.details.length > 0 ? (
            <>
              {stackedTooltipData.details.map((detail) => (
                <div key={detail.product} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: detail.color }} />
                    <span className={`text-xs ${detail.isHighlighted ? 'font-semibold text-[#111827] dark:text-white' : 'text-[#6B7280]'}`}>{detail.product}</span>
                  </div>
                  <span className={`text-sm font-thin ${detail.isHighlighted ? 'font-semibold' : ''} text-[#111827] dark:text-white`}>{formatCurrency(detail.earnings)}</span>
                </div>
              ))}
              <hr className="w-full border-[#E5E7EB] dark:border-[#374151]" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Equal className="w-3 h-3 text-[#111827] dark:text-white" />
                  <span className="text-xs text-[#6B7280]">Total</span>
                </div>
                <span className="text-sm font-thin text-[#111827] dark:text-white">{formatCurrency(stackedTooltipData.totalEarnings)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Equal className="w-3 h-3 text-[#111827] dark:text-white" />
                  <span className="text-xs text-[#6B7280]">Total</span>
                </div>
                <span className="text-sm font-thin text-[#111827] dark:text-white">{formatCurrency(tooltipData.value)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {tooltipData.change >= 0 ? (
                    <ArrowUp className="w-3 h-3 text-[#22C55E]" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-[#EF4444]" />
                  )}
                  <span className="text-xs text-[#6B7280]">{tooltipData.change >= 0 ? 'Increase' : 'Decrease'}</span>
                </div>
                <span className={`text-sm font-thin ${tooltipData.change >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {formatCurrency(Math.abs(tooltipData.change))}
                </span>
              </div>
            </>
          )}
        </div>
      </ChartTooltip>
    </div>
  );
}
