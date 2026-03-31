'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { formatCurrency } from '@/lib/utils/format';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';
import { designSystem } from '@/lib/const/appearance';

interface DataPoint {
  month: string;
  product: string;
  earnings: number;
}

interface HoverDetail {
  product: string;
  earnings: number;
  color: string;
  isHighlighted: boolean;
}

interface StackedAreaChartProps {
  data: DataPoint[];
  height?: number;
  tension?: number;
  onHover?: (event: { month: string; details: HoverDetail[]; x: number; y: number }) => void;
  onMouseOut?: () => void;
}

export function StackedAreaChart({ data, height = 300, tension = 0.4, onHover, onMouseOut }: StackedAreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    d3.select(container).selectAll('*').remove();

    const containerWidth = container.getBoundingClientRect().width;
    const margin = { top: 10, right: 10, bottom: 30, left: 60 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .style('overflow', 'visible');

    const months = [...new Set(data.map((d) => d.month))];
    const products = [...new Set(data.map((d) => d.product))];

    const productData: Record<string, { month: string; earnings: number }[]> = {};
    products.forEach((p) => (productData[p] = []));
    data.forEach((item) => {
      if (productData[item.product]) {
        productData[item.product].push({ month: item.month, earnings: item.earnings });
      }
    });
    products.forEach((p) => {
      const existing = productData[p].map((d) => d.month);
      months.forEach((m) => {
        if (!existing.includes(m)) productData[p].push({ month: m, earnings: 0 });
      });
      productData[p].sort((a, b) => months.indexOf(a.month) - months.indexOf(b.month));
    });

    const xScale = d3.scalePoint().domain(months).range([0, chartWidth]).padding(0);
    const maxEarnings = d3.max(Object.values(productData).flat(), (d) => d.earnings) ?? 0;
    const yScale = d3.scaleLinear().domain([0, maxEarnings]).nice().range([chartHeight, 0]);
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(products)
      .range(['#FF6B6B', '#48BFE3', '#06D6A0', '#FFD166', '#9D4EDD', '#FB5607', '#118AB2', '#6A4C93', '#EF476F', '#80ED99', '#F29E4C', '#B298DC']);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const lineGen = d3
      .line<{ month: string; earnings: number }>()
      .x((d) => xScale(d.month) ?? 0)
      .y((d) => yScale(d.earnings))
      .curve(d3.curveCardinal.tension(tension));

    const areaGen = d3
      .area<{ month: string; earnings: number }>()
      .x((d) => xScale(d.month) ?? 0)
      .y0(chartHeight)
      .y1((d) => yScale(d.earnings))
      .curve(d3.curveCardinal.tension(tension));

    Object.entries(productData).forEach(([product, values]) => {
      const color = d3.rgb(colorScale(product) as string);
      const gradientId = `gradient-${product.replace(/\s+/g, '-').toLowerCase()}`;

      const defs = svg.append('defs').append('linearGradient').attr('id', gradientId).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      defs.append('stop').attr('offset', '0%').attr('stop-color', color.toString()).attr('stop-opacity', 0.15);
      defs.append('stop').attr('offset', '100%').attr('stop-color', color.toString()).attr('stop-opacity', 0);

      g.append('path').datum(values).attr('fill', `url(#${gradientId})`).attr('opacity', 0.7).attr('d', areaGen);
      g.append('path').datum(values).attr('fill', 'none').attr('stroke', color.toString()).attr('stroke-width', 2).attr('d', lineGen);

      g.selectAll(`.point-${product.replace(/\s+/g, '-').toLowerCase()}`)
        .data(values.filter((d) => d.earnings > 0))
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.month) ?? 0)
        .attr('cy', (d) => yScale(d.earnings))
        .attr('r', 4)
        .attr('fill', color.toString())
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5)
        .attr('cursor', 'pointer')
        .on('mouseover', function (event, d) {
          d3.select(this).attr('r', 6);
          const details = products.map((subj) => {
            const dp = productData[subj].find((item) => item.month === d.month);
            return { product: subj, earnings: dp?.earnings ?? 0, color: colorScale(subj) as string, isHighlighted: subj === product };
          }).filter((det) => det.earnings > 0);
          const xPos = xScale(d.month) ?? 0;
          mouseLine.attr('d', `M${xPos},${chartHeight} ${xPos},0`).style('opacity', '1');
          onHover?.({ month: d.month, details, x: xPos + margin.left, y: event.clientY - container.getBoundingClientRect().top });
        })
        .on('mouseout', function () {
          d3.select(this).attr('r', 4);
        });
    });

    const isDark = theme === 'dark';
    const gridColor = isDark ? designSystem.colors.chart.grid.dark : designSystem.colors.chart.grid.light;

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

    const mouseG = g.append('g');
    const mouseLine = mouseG
      .append('path')
      .style('stroke', isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')
      .style('stroke-width', '1px')
      .style('opacity', '0');

    mouseG
      .append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', () => {
        mouseLine.style('opacity', '0');
        onMouseOut?.();
      })
      .on('mouseover', () => mouseLine.style('opacity', '1'))
      .on('mousemove', function (event) {
        const mouse = d3.pointer(event);
        const monthWidth = chartWidth / months.length;
        const monthIndex = Math.min(Math.floor(mouse[0] / monthWidth), months.length - 1);
        if (monthIndex >= 0) {
          const month = months[monthIndex];
          const details = products.map((subj) => {
            const dp = productData[subj].find((item) => item.month === month);
            return { product: subj, earnings: dp?.earnings ?? 0, color: colorScale(subj) as string, isHighlighted: false };
          }).filter((det) => det.earnings > 0);
          const xPos = xScale(month) ?? 0;
          mouseLine.attr('d', `M${xPos},${chartHeight} ${xPos},0`);
          onHover?.({ month, details, x: xPos + margin.left, y: mouse[1] + margin.top });
        }
      });
  }, [data, height, tension, theme, onHover, onMouseOut]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: `${height}px` }} />;
}
