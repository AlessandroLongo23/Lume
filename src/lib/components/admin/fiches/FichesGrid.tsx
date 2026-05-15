'use client';

import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Calendar } from 'lucide-react';
import { FicheCard } from './FicheCard';
import { FicheModal } from '@/lib/components/admin/fiches/FicheModal';
import { DeleteFicheModal } from './DeleteFicheModal';
import type { Fiche } from '@/lib/types/Fiche';

interface FichesGridProps {
  fiches: Fiche[];
  emptyText?: string;
}

// Matches Tailwind's md/lg breakpoints used on the grid below.
function getColCount(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 768) return 2;
  return 1;
}

export function FichesGrid({ fiches, emptyText }: FichesGridProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null);
  const [editInitialView, setEditInitialView] = useState<'edit' | 'payment'>('edit');

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [colCount, setColCount] = useState(3);

  const isEmpty = fiches.length === 0;
  const rowCount = Math.ceil(fiches.length / colCount);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setColCount(getColCount(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fade in the top/bottom mask only when there's content scrolled past the edge.
  useEffect(() => {
    const el = scrollRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const FADE = 24;
    const update = () => {
      const top = Math.min(el.scrollTop, FADE);
      const bottom = Math.max(
        0,
        Math.min(el.scrollHeight - el.scrollTop - el.clientHeight, FADE)
      );
      el.style.setProperty('--top-fade', `${top}px`);
      el.style.setProperty('--bottom-fade', `${bottom}px`);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(inner);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [isEmpty]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 290,
    overscan: 4,
  });

  // Row content shifts when columns reflow, so previously cached heights are
  // no longer correct for the same row index — drop them and re-measure.
  useEffect(() => {
    virtualizer.measure();
  }, [colCount, virtualizer]);

  const colsClass =
    colCount === 3 ? 'grid-cols-3' : colCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
        {isEmpty ? (
          <div className="min-h-[18.75rem] flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <Calendar className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mb-3" />
            <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">{emptyText ?? 'Nessuna fiche trovata'}</h3>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto -mr-4 pr-4"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0, black var(--top-fade, 0px), black calc(100% - var(--bottom-fade, 0px)), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0, black var(--top-fade, 0px), black calc(100% - var(--bottom-fade, 0px)), transparent 100%)',
            }}
          >
            <div
              ref={innerRef}
              className="animate-fade-in relative w-full"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((vRow) => {
                const start = vRow.index * colCount;
                const rowFiches = fiches.slice(start, start + colCount);
                return (
                  <div
                    key={vRow.key}
                    data-index={vRow.index}
                    ref={virtualizer.measureElement}
                    className={`absolute inset-x-0 grid gap-4 pb-4 ${colsClass}`}
                    style={{ transform: `translateY(${vRow.start}px)` }}
                  >
                    {rowFiches.map((fiche) => (
                      <FicheCard
                        key={fiche.id}
                        fiche={fiche}
                        onEdit={(f) => { setSelectedFiche(f); setEditInitialView('edit'); setShowEdit(true); }}
                        onDelete={(f) => { setSelectedFiche(f); setShowDelete(true); }}
                        onCheckout={(f) => { setSelectedFiche(f); setEditInitialView('payment'); setShowEdit(true); }}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <FicheModal
        mode="edit"
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        fiche={selectedFiche}
        initialView={editInitialView}
      />
      <DeleteFicheModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        selectedFiche={selectedFiche}
      />
    </>
  );
}
