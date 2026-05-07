'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Users, X } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { FacetedFilter } from '@/lib/components/admin/table/FacetedFilter';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Client } from '@/lib/types/Client';

interface ClientsGridProps {
  clients: Client[];
  showArchived?: boolean;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Uomo' },
  { value: 'F', label: 'Donna' },
];

// Matches Tailwind's sm/lg breakpoints used on the grid below.
function getColCount(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export function ClientsGrid({ clients, showArchived = false }: ClientsGridProps) {
  const archiveClient = useClientsStore((s) => s.archiveClient);
  const restoreClient = useClientsStore((s) => s.restoreClient);

  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);

  const filteredClients = useMemo(() => {
    let data = clients;
    if (selectedGenders.length > 0) data = data.filter((c) => selectedGenders.includes(c.gender));
    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter((c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        `${c.phonePrefix ?? ''} ${c.phoneNumber ?? ''}`.toLowerCase().includes(q)
      );
    }
    return data;
  }, [clients, selectedGenders, globalFilter]);

  const handleArchive = async (client: Client) => {
    try {
      await archiveClient(client.id);
      messagePopup.getState().success('Cliente archiviato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante l’archiviazione.');
    }
  };

  const handleRestore = async (client: Client) => {
    try {
      await restoreClient(client.id);
      messagePopup.getState().success('Cliente ripristinato con successo.');
    } catch {
      messagePopup.getState().error('Errore durante il ripristino.');
    }
  };

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [colCount, setColCount] = useState(3);

  const isEmpty = filteredClients.length === 0;
  const rowCount = Math.ceil(filteredClients.length / colCount);

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
    estimateSize: () => 224,
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
    <div className="flex-1 min-h-0 flex flex-col gap-4 w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex items-center flex-1 max-w-sm">
          <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca cliente..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full py-2 pl-9 pr-8 text-sm bg-transparent border rounded-lg
              border-border focus:border-foreground/30
              text-foreground placeholder:text-muted-foreground
              outline-none transition-colors"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter('')}
              aria-label="Cancella ricerca"
              className="absolute right-2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FacetedFilter label="Genere" options={GENDER_OPTIONS} selected={selectedGenders} onChange={setSelectedGenders} />
      </div>

      {isEmpty ? (
        <div className="min-h-[18.75rem] flex flex-col items-center justify-center p-8 bg-muted/40 rounded-lg border border-dashed border-border">
          <Users className="w-16 h-16 text-muted-foreground/60 mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nessun cliente trovato</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">Nessun cliente soddisfa i criteri di ricerca.</p>
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
              const rowClients = filteredClients.slice(start, start + colCount);
              return (
                <div
                  key={vRow.key}
                  data-index={vRow.index}
                  ref={virtualizer.measureElement}
                  className={`absolute inset-x-0 grid gap-4 pb-4 ${colsClass}`}
                  style={{ transform: `translateY(${vRow.start}px)` }}
                >
                  {rowClients.map((client) => (
                    <ClientCard
                      key={client.id}
                      client={client}
                      onArchive={handleArchive}
                      onRestore={handleRestore}
                      showArchived={showArchived}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
