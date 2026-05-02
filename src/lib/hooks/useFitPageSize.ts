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
  headerPx = 49,
  fallback = 10,
  min = 1,
}: Options) {
  const ref = useRef<T>(null);
  const [pageSize, setPageSize] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const h = el.clientHeight;
      if (h <= 0) return;
      const fitting = Math.max(min, Math.floor((h - headerPx) / rowPx));
      setPageSize((prev) => (prev === fitting ? prev : fitting));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowPx, headerPx, min]);

  return { ref, pageSize };
}
