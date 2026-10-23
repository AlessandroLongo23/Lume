'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks whether a scroll container has hidden content above or below, so the
 * edge can fade and show there is more to scroll to (the scrollbar may be hidden).
 */
export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ above: false, below: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const above = el.scrollTop > 1;
      const below = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setEdges((prev) => (prev.above === above && prev.below === below ? prev : { above, below }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  return { ref, ...edges };
}

/** CSS mask that fades whichever edges have hidden content. */
export function scrollEdgeMask({ above, below }: { above: boolean; below: boolean }) {
  if (!above && !below) return undefined;
  const fade = '1.5rem';
  return `linear-gradient(to bottom, ${above ? 'transparent' : '#000'}, #000 ${fade}, #000 calc(100% - ${fade}), ${below ? 'transparent' : '#000'})`;
}
