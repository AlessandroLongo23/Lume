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

  // Anti-oscillation state. The fitting count is derived from the measured row
  // height; if a row's height depends on which rows are currently shown (e.g. a
  // cell whose content wraps to a variable number of lines), the count becomes a
  // function of pageSize, which is itself the input — a feedback loop that flips
  // pageSize between two values and flickers the table. We refuse to flip back to
  // the value we just left UNLESS the container height actually changed (a real
  // resize, not the loop). In steady state this guard never triggers.
  const sizeRef = useRef(fallback);
  const leftValueRef = useRef(fallback);
  const lastHeightRef = useRef(-1);

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
      const heightChanged = h !== lastHeightRef.current;
      lastHeightRef.current = h;

      const prev = sizeRef.current;
      if (prev === fitting) return;
      // Same container height, computing back to the value we just left → the
      // measurement is oscillating. Hold steady instead of flickering.
      if (!heightChanged && fitting === leftValueRef.current) return;

      leftValueRef.current = prev;
      sizeRef.current = fitting;
      setPageSize(fitting);
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
