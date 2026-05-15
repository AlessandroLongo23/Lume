'use client';

import { useEffect, useRef, useState } from 'react';

interface Options {
  rowPx: number;
  headerPx?: number;
  fallback?: number;
  min?: number;
}

export function useFitPageSize<T extends HTMLElement = HTMLDivElement>({
  rowPx,
  headerPx,
  fallback = 10,
  min = 1,
}: Options) {
  const ref = useRef<T>(null);
  const [pageSize, setPageSize] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;

    const compute = () => {
      // `el` should be the overflow-x-auto scroll container so its clientHeight
      // already excludes the horizontal scrollbar when one is present.
      const h = el.clientHeight;
      if (h <= 0) return;

      const thead = el.querySelector('thead');
      const tbodyRow = el.querySelector('tbody tr');
      const measuredHeader = thead?.getBoundingClientRect().height ?? headerPx ?? 49;
      const measuredRow = tbodyRow?.getBoundingClientRect().height ?? rowPx;
      if (measuredRow <= 0) return;

      const fitting = Math.max(min, Math.floor((h - measuredHeader) / measuredRow));
      setPageSize((prev) => (prev === fitting ? prev : fitting));
    };

    const scheduleCompute = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        compute();
      });
    };

    compute();
    const ro = new ResizeObserver(scheduleCompute);
    ro.observe(el);
    const scrollable = el.querySelector('table')?.parentElement;
    if (scrollable instanceof HTMLElement) ro.observe(scrollable);

    const tbody = el.querySelector('tbody');
    const mo = tbody ? new MutationObserver(scheduleCompute) : null;
    mo?.observe(tbody!, { childList: true });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      mo?.disconnect();
    };
  }, [rowPx, headerPx, min]);

  return { ref, pageSize };
}
