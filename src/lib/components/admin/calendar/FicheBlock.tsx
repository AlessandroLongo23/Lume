'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { GripVertical, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useClientsStore } from '@/lib/stores/clients';
import { useCalendarDragStore } from '@/lib/stores/calendarDrag';
import { useCalendarDragContext } from './CalendarDragContext';
import { HoverPopover } from '@/lib/components/shared/ui/HoverPopover';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheService } from '@/lib/types/FicheService';

interface FicheBlockProps {
  fiche: Fiche;
  /** Services on this fiche assigned to the rendering operator, sorted by start_time. */
  operatorServices: FicheService[];
  /** Total minutes spanned by `operatorServices` (may include gaps). */
  totalMinutes: number;
  timeStep: number;
  /** Vertical offset (in rem) from the anchor slot's top — non-zero when the run
   *  starts at a time not aligned to the current granularity (e.g. 11:15 with 10-min slots). */
  topOffsetRem?: number;
  isPast: boolean;
  /** True when the operator-filtered services equal the entire fiche AND are contiguous. */
  isBlockDragEligible: boolean;
  onSelectFiche: () => void;
}

/** Move threshold (px) to distinguish click from drag. */
const DRAG_THRESHOLD = 4;

function withOpacity(hex: string, opacity: number): string {
  const clamped = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return `${hex}${clamped.toString(16).padStart(2, '0')}`;
}

export function FicheBlock({
  fiche,
  operatorServices,
  totalMinutes,
  timeStep,
  topOffsetRem = 0,
  isPast,
  isBlockDragEligible,
  onSelectFiche,
}: FicheBlockProps) {
  const router = useRouter();
  const services = useServicesStore((s) => s.services);
  const categories = useServiceCategoriesStore((s) => s.service_categories);
  const clients = useClientsStore((s) => s.clients);
  const { beginMove, beginResize } = useCalendarDragContext();

  const dragActive = useCalendarDragStore((s) => s.active);
  const dragKind = useCalendarDragStore((s) => s.kind);
  const dragFicheId = useCalendarDragStore((s) => s.ficheId);
  const dragServiceIds = useCalendarDragStore((s) => s.ficheServiceIds);
  const dragValid = useCalendarDragStore((s) => s.conflict.valid);

  const client = clients.find((c) => c.id === fiche.client_id) ?? null;
  const status = fiche.status;
  const isLocked = status === 'completed' || isPast;

  const firstService = operatorServices[0];
  const lastService = operatorServices[operatorServices.length - 1];

  const accentColor = useMemo(() => {
    if (!firstService) return DEFAULT_CATEGORY_COLOR;
    const svc = services.find((s) => s.id === firstService.service_id);
    const cat = svc ? categories.find((c) => c.id === svc.category_id) : null;
    return cat?.color ?? DEFAULT_CATEGORY_COLOR;
  }, [firstService, services, categories]);

  /** This block is itself the source of an active drag. */
  const isThisFicheDragging = dragActive && dragFicheId === fiche.id;

  function fadeForOtherSegments(serviceId: string): string {
    if (!isThisFicheDragging) return '';
    if (dragKind === 'move-block') return '';
    // Single-service or resize: dim siblings that aren't directly affected
    if (!dragServiceIds.includes(serviceId)) return 'opacity-40';
    return '';
  }

  /** Threshold-gated drag activator. Falls back to onSelectFiche on plain click. */
  function makeMoveStarter(kind: 'move-block' | 'move-service', getServices: () => FicheService[]) {
    return (e: React.PointerEvent) => {
      if (isLocked) return;
      e.stopPropagation();
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY };
      // Anchor offset to the SEGMENT root that owns this pointer-down — the segment
      // being moved (or, for block drag, the first segment of the run, which equals
      // the block top since the top resize handle is absolutely positioned).
      const target = e.currentTarget as HTMLElement;
      const segmentRoot = (target.closest('[data-segment-root]') as HTMLElement | null) ?? target;
      const anchorTop = segmentRoot.getBoundingClientRect().top;
      const grabOffsetY = e.clientY - anchorTop;
      let started = false;
      const onMove = (ev: PointerEvent) => {
        const dist = Math.hypot(ev.clientX - start.x, ev.clientY - start.y);
        if (!started && dist >= DRAG_THRESHOLD) {
          started = true;
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          beginMove({
            kind,
            ficheId: fiche.id,
            services: getServices(),
            pointer: { clientX: ev.clientX, clientY: ev.clientY },
            grabOffsetY,
          });
        }
      };
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        if (!started) onSelectFiche();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };
  }

  function startResize(
    kind: 'resize-top' | 'resize-bottom' | 'resize-seam-up' | 'resize-seam-down',
    service: FicheService,
  ) {
    return (e: React.PointerEvent) => {
      if (isLocked) return;
      e.stopPropagation();
      e.preventDefault();
      beginResize({
        kind,
        ficheId: fiche.id,
        service,
        pointer: { clientX: e.clientX, clientY: e.clientY },
      });
    };
  }

  if (!firstService || !lastService) return null;

  const headerLabel = client?.getFullName() ?? 'Cliente';
  const blockBorderColor = isThisFicheDragging && !dragValid ? '#ef4444' : undefined;
  const blockBorderClass = isThisFicheDragging
    ? dragValid
      ? 'ring-2 ring-primary/60'
      : 'ring-2 ring-red-500/70'
    : '';

  return (
    <div
      className={`group/block absolute left-0 w-full flex flex-col rounded-md z-raised overflow-hidden shadow-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 ${
        isPast ? 'opacity-60' : ''
      } ${blockBorderClass} ${
        isThisFicheDragging && (dragKind === 'move-block' || dragKind === 'move-service')
          ? 'pointer-events-none opacity-50'
          : ''
      }`}
      style={{
        top: `${topOffsetRem}rem`,
        height: `${(totalMinutes / timeStep) * 2}rem`,
        borderLeftWidth: '3px',
        borderLeftStyle: 'solid',
        borderLeftColor: blockBorderColor ?? accentColor,
        ...(blockBorderColor
          ? {
              borderTopColor: blockBorderColor,
              borderRightColor: blockBorderColor,
              borderBottomColor: blockBorderColor,
            }
          : {}),
      }}
    >
      {/* Top resize handle (first service start time) */}
      {!isLocked && (
        <Tooltip label="Sposta inizio">
          <button
            type="button"
            aria-label="Sposta inizio"
            onPointerDown={startResize('resize-top', firstService)}
            className="absolute top-0 left-0 right-0 h-1.5 z-content-floating cursor-ns-resize hover:bg-primary/30"
          />
        </Tooltip>
      )}

      {/* Service segments — segment heights sum to totalMinutes, so the block
          aligns precisely with the time grid. The first segment hosts a small
          header strip (block-drag) above its body (single-service drag). */}
      {operatorServices.map((fs, index) => {
        const service = services.find((s) => s.id === fs.service_id);
        const category = service ? categories.find((c) => c.id === service.category_id) : null;
        const color = category?.color ?? DEFAULT_CATEGORY_COLOR;
        const blockHeightRem = (fs.duration / timeStep) * 2;
        const startTime = format(new Date(fs.start_time), 'HH:mm');
        const endTime = format(new Date(fs.end_time), 'HH:mm');
        const isSegmentDragging = isThisFicheDragging && dragServiceIds.includes(fs.id);
        const isSeam = index < operatorServices.length - 1;
        const lower = isSeam ? operatorServices[index + 1] : null;
        const isFirst = index === 0;

        const headerStarter = isBlockDragEligible
          ? makeMoveStarter('move-block', () => operatorServices)
          : makeMoveStarter('move-service', () => [fs]);
        const bodyStarter = makeMoveStarter('move-service', () => [fs]);

        const headerTitle = isLocked
          ? 'Fiche già chiusa, non modificabile'
          : isBlockDragEligible
            ? 'Trascina per spostare l’intera fiche'
            : 'I servizi di questa fiche sono su operatori diversi: trascina ciascuno singolarmente';
        const bodyTitle = isLocked
          ? 'Fiche già chiusa, non modificabile'
          : 'Trascina per spostare il servizio';

        return (
          <div
            key={fs.id}
            data-segment-root
            className={`relative shrink-0 select-none flex flex-col ${fadeForOtherSegments(fs.id)} ${
              isSegmentDragging ? 'ring-1 ring-inset ring-primary/40' : ''
            }`}
            style={{
              height: `${blockHeightRem}rem`,
              backgroundColor: withOpacity(color, 0.13),
              borderTop: index > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
            }}
          >
            {isFirst && (
              <Tooltip label={headerTitle} side="top">
                <div
                  role="button"
                  tabIndex={0}
                  onPointerDown={headerStarter}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectFiche();
                    }
                  }}
                  className={`group/seg shrink-0 flex items-center gap-1 px-2 py-1 min-w-0 border-b border-black/5 dark:border-white/5 ${
                    isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                  }`}
                  style={{ backgroundColor: withOpacity(color, 0.10) }}
                >
                  {!isLocked && isBlockDragEligible && (
                    <div className="overflow-hidden flex shrink-0 w-0 -mr-1 group-hover/seg:w-3 group-hover/seg:mr-0 transition-[width,margin] duration-200 ease-out">
                      <GripVertical className="size-3 text-zinc-400 shrink-0 -translate-x-3 group-hover/seg:translate-x-0 transition-transform duration-200 ease-out" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight min-w-0">
                    {headerLabel}
                  </p>
                  {client && (
                    <ClientSchedaIcon
                      client={client}
                      onOpen={() => router.push(`/admin/clienti/${client.id}#scheda`)}
                    />
                  )}
                </div>
              </Tooltip>
            )}
            <Tooltip label={bodyTitle} side="top">
              <div
                role="button"
                tabIndex={0}
                onPointerDown={bodyStarter}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectFiche();
                  }
                }}
                className={`group/body flex-1 min-h-0 overflow-hidden px-2 py-1 flex items-start ${
                  isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                }`}
              >
              {!isLocked && (
                <div className="overflow-hidden flex shrink-0 w-0 mr-0 group-hover/body:w-3 group-hover/body:mr-1 transition-[width,margin] duration-200 ease-out mt-px">
                  <GripVertical className="size-3 text-zinc-400 shrink-0 -translate-x-3 group-hover/body:translate-x-0 transition-transform duration-200 ease-out" />
                </div>
              )}
                <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate leading-tight min-w-0">
                  {service?.name ?? 'Servizio'}
                  {blockHeightRem >= 2 && (
                    <span className="text-zinc-500 dark:text-zinc-400"> • {startTime}–{endTime}</span>
                  )}
                </p>
              </div>
            </Tooltip>

            {/* Seam chevrons — disambiguate which segment to resize */}
            {isSeam && lower && !isLocked && (
              <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-content-floating pointer-events-none flex items-center justify-center gap-0.5 opacity-0 group-hover/block:opacity-100">
                <Tooltip label="Estendi/accorcia il servizio precedente">
                  <button
                    type="button"
                    aria-label="Estendi servizio precedente"
                    onPointerDown={startResize('resize-seam-up', fs)}
                    className="pointer-events-auto rounded-full bg-zinc-100 dark:bg-zinc-700 ring-1 ring-zinc-500/30 size-4 flex items-center justify-center cursor-row-resize hover:bg-primary hover:text-white"
                  >
                    <ChevronUp className="size-3" />
                  </button>
                </Tooltip>
                <Tooltip label="Estendi/accorcia il servizio successivo">
                  <button
                    type="button"
                    aria-label="Estendi servizio successivo"
                    onPointerDown={startResize('resize-seam-down', lower)}
                    className="pointer-events-auto rounded-full bg-zinc-100 dark:bg-zinc-700 ring-1 ring-zinc-500/30 size-4 flex items-center justify-center cursor-row-resize hover:bg-primary hover:text-white"
                  >
                    <ChevronDown className="size-3" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom resize handle (last service end time) */}
      {!isLocked && (
        <Tooltip label="Sposta fine">
          <button
            type="button"
            aria-label="Sposta fine"
            onPointerDown={startResize('resize-bottom', lastService)}
            className="absolute bottom-0 left-0 right-0 h-1.5 z-content-floating cursor-ns-resize hover:bg-primary/30"
          />
        </Tooltip>
      )}

      {/* Cascade-mode badge */}
      {isThisFicheDragging && useCalendarDragStore.getState().cascade && (
        <div className="absolute top-1 right-1 z-content-floating text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary text-white shadow">
          Sposta successivi
        </div>
      )}
    </div>
  );
}

function ClientSchedaIcon({ client, onOpen }: { client: NonNullable<ReturnType<Fiche['getClient']>>; onOpen: () => void }) {
  const last = client.getLastTreatment();
  const lastLabel = last
    ? format(new Date(last.datetime), 'd MMM yyyy', { locale: itLocale })
    : null;

  const popoverContent = last ? (
    <div className="text-xs space-y-1.5">
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{lastLabel}</p>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <span className="text-zinc-500 dark:text-zinc-400">Miscela</span>
        <span className="text-zinc-800 dark:text-zinc-100">{last.miscela?.trim() || '—'}</span>
        <span className="text-zinc-500 dark:text-zinc-400">Tecnica</span>
        <span className="text-zinc-800 dark:text-zinc-100">{last.tecnica?.trim() || '—'}</span>
      </div>
      {last.note?.trim() && (
        <p className="text-zinc-600 dark:text-zinc-300 pt-1 border-t border-zinc-500/20 whitespace-pre-wrap">
          {last.note}
        </p>
      )}
      <p className="text-2xs text-zinc-400 pt-1">Clicca per la scheda completa</p>
    </div>
  ) : (
    <div className="text-xs text-zinc-500 dark:text-zinc-400">
      Nessuno storico trattamenti
    </div>
  );

  return (
    <HoverPopover
      placement="bottom"
      align="start"
      onTriggerClick={onOpen}
      triggerClassName="shrink-0 inline-flex items-center cursor-pointer text-zinc-400 hover:text-primary transition-colors"
      trigger={<Info className="size-3.5" />}
      content={popoverContent}
    />
  );
}
