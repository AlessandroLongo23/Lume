'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { it as itLocale } from 'date-fns/locale';
import { GripVertical, ChevronUp, ChevronDown, Info, Globe, Check } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useClientsStore } from '@/lib/stores/clients';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useCalendarDragStore } from '@/lib/stores/calendarDrag';
import { useCalendarDragContext } from './CalendarDragContext';
import { HoverPopover } from '@/lib/components/shared/ui/HoverPopover';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import { colorForClient } from '@/lib/utils/clientColor';
import { ClientColorDot } from '@/lib/components/admin/clients/ClientColorDot';
import type { Fiche } from '@/lib/types/Fiche';
import { FicheStatus } from '@/lib/types/ficheStatus';
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

/** Mixes a swatch colour into transparency, so the fill sits on any surface in both themes. */
function tint(color: string, percent: number): string {
  return `color-mix(in oklab, ${color} ${percent}%, transparent)`;
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
  const updateClient = useClientsStore((s) => s.updateClient);
  const colorByClient = useSalonSettingsStore((s) => s.settings?.color_by_client ?? true);
  const { beginMove, beginResize } = useCalendarDragContext();

  const dragActive = useCalendarDragStore((s) => s.active);
  const dragKind = useCalendarDragStore((s) => s.kind);
  const dragFicheId = useCalendarDragStore((s) => s.ficheId);
  const dragServiceIds = useCalendarDragStore((s) => s.ficheServiceIds);
  const dragValid = useCalendarDragStore((s) => s.conflict.valid);

  const client = clients.find((c) => c.id === fiche.client_id) ?? null;

  const firstService = operatorServices[0];
  const lastService = operatorServices[operatorServices.length - 1];

  const accentColor = useMemo(() => {
    if (colorByClient && client) return colorForClient(client);
    if (!firstService) return DEFAULT_CATEGORY_COLOR;
    const svc = services.find((s) => s.id === firstService.service_id);
    const cat = svc ? categories.find((c) => c.id === svc.category_id) : null;
    return cat?.color ?? DEFAULT_CATEGORY_COLOR;
  }, [colorByClient, client, firstService, services, categories]);

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
  // Edge: a 1px inset ring in the block's own colour. While this fiche is being
  // dragged it becomes a 2px ring: indigo when the drop is valid, danger when not.
  const blockEdge = isThisFicheDragging
    ? dragValid
      ? '0 0 0 2px var(--lume-accent)'
      : '0 0 0 2px var(--lume-danger-fg)'
    : `inset 0 0 0 1px ${tint(accentColor, 28)}`;
  const isCompleted = fiche.status === FicheStatus.COMPLETED;
  const awaitsApproval = fiche.status === FicheStatus.PENDING_APPROVAL;

  return (
    <div
      className={`group/block absolute left-0.5 right-0.5 flex flex-col rounded-md z-raised overflow-hidden bg-[var(--lume-panel)] ${
        isPast ? 'opacity-70' : ''
      } ${
        isThisFicheDragging && (dragKind === 'move-block' || dragKind === 'move-service')
          ? 'pointer-events-none opacity-50'
          : ''
      }`}
      style={{
        top: `${topOffsetRem}rem`,
        height: `${(totalMinutes / timeStep) * 2}rem`,
        boxShadow: blockEdge,
      }}
    >
      {/* Top resize handle (first service start time) */}
      <Tooltip label="Sposta inizio">
        <button
          type="button"
          aria-label="Sposta inizio"
          onPointerDown={startResize('resize-top', firstService)}
          // ds-ignore: calendar resize handle, a 6px pointer-drag strip along the block edge, not a control-sized button
          className="absolute top-0 left-0 right-0 h-1.5 z-content-floating cursor-ns-resize hover:bg-strong"
        />
      </Tooltip>

      {/* Service segments — segment heights sum to totalMinutes, so the block
          aligns precisely with the time grid. The first segment hosts a small
          header strip (block-drag) above its body (single-service drag). */}
      {operatorServices.map((fs, index) => {
        const service = services.find((s) => s.id === fs.service_id);
        const category = service ? categories.find((c) => c.id === service.category_id) : null;
        const color = colorByClient ? accentColor : (category?.color ?? DEFAULT_CATEGORY_COLOR);
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

        const headerTitle = isBlockDragEligible
          ? 'Trascina per spostare l’intera fiche'
          : 'I servizi di questa fiche sono su operatori diversi: trascina ciascuno singolarmente';
        const bodyTitle = 'Trascina per spostare il servizio';

        return (
          <div
            key={fs.id}
            data-segment-root
            className={`relative shrink-0 select-none flex flex-col ${fadeForOtherSegments(fs.id)} ${
              isSegmentDragging ? 'shadow-[inset_0_0_0_1px_var(--lume-accent)]' : ''
            }`}
            style={{
              height: `${blockHeightRem}rem`,
              backgroundColor: tint(color, 16),
              borderTop: index > 0 ? `1px solid ${tint(color, 30)}` : undefined,
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
                  className="group/seg shrink-0 flex items-center gap-1.5 pl-2 pr-1.5 pt-1 min-w-0 cursor-grab active:cursor-grabbing rounded-t-md focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--lume-ring-focus)]"
                >
                  {isBlockDragEligible && (
                    <div className="overflow-hidden flex shrink-0 w-0 -mr-1.5 group-hover/seg:w-3 group-hover/seg:mr-0 transition-[width,margin] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none">
                      <GripVertical className="size-3 text-[var(--lume-text-muted)] shrink-0 -translate-x-3 group-hover/seg:translate-x-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none" />
                    </div>
                  )}
                  {client && (
                    <ClientColorDot
                      clientId={client.id}
                      color={client.color}
                      onChange={async (next) => {
                        try {
                          await updateClient(client.id, { color: next });
                        } catch {
                          messagePopup.getState().error('Impossibile aggiornare il colore');
                        }
                      }}
                    />
                  )}
                  <p className="text-compact font-medium tracking-tight text-[var(--lume-text)] truncate leading-tight min-w-0">
                    {headerLabel}
                  </p>
                  {isCompleted && (
                    <Tooltip label="Conclusa" side="top">
                      <span className="inline-flex shrink-0 text-success-strong">
                        <Check className="size-3" strokeWidth={2.5} aria-label="Conclusa" />
                      </span>
                    </Tooltip>
                  )}
                  {awaitsApproval && (
                    <Tooltip label="Da approvare" side="top">
                      <span className="inline-flex shrink-0 items-center justify-center size-3 text-warning-strong">
                        <span className="size-1.5 rounded-full bg-current" />
                        <span className="sr-only">Da approvare</span>
                      </span>
                    </Tooltip>
                  )}
                  {fiche.booking_source === 'online' && (
                    <Tooltip label="Prenotazione online" side="top">
                      <span className="inline-flex shrink-0 text-[var(--lume-text-secondary)]">
                        <Globe className="size-3" aria-label="Prenotazione online" />
                      </span>
                    </Tooltip>
                  )}
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
                className="group/body flex-1 min-h-0 overflow-hidden px-2 py-1 flex items-start cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--lume-ring-focus)]"
              >
                <div className="overflow-hidden flex shrink-0 w-0 mr-0 group-hover/body:w-3 group-hover/body:mr-1 transition-[width,margin] duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none mt-px">
                  <GripVertical className="size-3 text-[var(--lume-text-muted)] shrink-0 -translate-x-3 group-hover/body:translate-x-0 transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none" />
                </div>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <p className="text-xs text-[var(--lume-text-secondary)] truncate leading-tight">
                    {service?.name ?? 'Servizio'}
                  </p>
                  {/* Time on its own line when the segment has room for it. */}
                  {blockHeightRem - (isFirst ? 1.5 : 0) >= 2.5 && (
                    <p className="tabular-nums text-2xs leading-tight text-[var(--lume-text-muted)] truncate">
                      {startTime}–{endTime}
                    </p>
                  )}
                </div>
              </div>
            </Tooltip>

            {/* Seam chevrons — disambiguate which segment to resize */}
            {isSeam && lower && (
              <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-content-floating pointer-events-none flex items-center justify-center gap-0.5 opacity-0 group-hover/block:opacity-100">
                <Tooltip label="Estendi/accorcia il servizio precedente">
                  <button
                    type="button"
                    aria-label="Estendi servizio precedente"
                    onPointerDown={startResize('resize-seam-up', fs)}
                    // ds-ignore: seam resize handle, a 16px round chevron dragged with the pointer, not a control-sized button
                    className="pointer-events-auto rounded-full bg-[var(--lume-surface-raised)] text-[var(--lume-text-secondary)] shadow-[inset_0_0_0_1px_var(--lume-edge)] size-4 flex items-center justify-center cursor-row-resize hover:bg-[var(--lume-text)] hover:text-[var(--lume-surface-raised)]"
                  >
                    <ChevronUp className="size-3" />
                  </button>
                </Tooltip>
                <Tooltip label="Estendi/accorcia il servizio successivo">
                  <button
                    type="button"
                    aria-label="Estendi servizio successivo"
                    onPointerDown={startResize('resize-seam-down', lower)}
                    // ds-ignore: seam resize handle, a 16px round chevron dragged with the pointer, not a control-sized button
                    className="pointer-events-auto rounded-full bg-[var(--lume-surface-raised)] text-[var(--lume-text-secondary)] shadow-[inset_0_0_0_1px_var(--lume-edge)] size-4 flex items-center justify-center cursor-row-resize hover:bg-[var(--lume-text)] hover:text-[var(--lume-surface-raised)]"
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
      <Tooltip label="Sposta fine">
        <button
          type="button"
          aria-label="Sposta fine"
          onPointerDown={startResize('resize-bottom', lastService)}
          // ds-ignore: calendar resize handle, a 6px pointer-drag strip along the block edge, not a control-sized button
          className="absolute bottom-0 left-0 right-0 h-1.5 z-content-floating cursor-ns-resize hover:bg-strong"
        />
      </Tooltip>

      {/* Cascade-mode badge */}
      {isThisFicheDragging && useCalendarDragStore.getState().cascade && (
        <div className="absolute top-1 right-1 z-content-floating text-2xs font-medium px-1.5 py-0.5 rounded-sm bg-[var(--lume-accent)] text-[var(--lume-text-on-accent)]">
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
      <p className="font-medium text-[var(--lume-text)]">{lastLabel}</p>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
        <span className="text-[var(--lume-text-secondary)]">Miscela</span>
        <span className="text-[var(--lume-text)]">{last.miscela?.trim() || '—'}</span>
        <span className="text-[var(--lume-text-secondary)]">Tecnica</span>
        <span className="text-[var(--lume-text)]">{last.tecnica?.trim() || '—'}</span>
      </div>
      {last.note?.trim() && (
        <p className="text-[var(--lume-text-secondary)] pt-1 border-t border-line whitespace-pre-wrap">
          {last.note}
        </p>
      )}
      <p className="text-2xs text-[var(--lume-text-muted)] pt-1">Clicca per la scheda completa</p>
    </div>
  ) : (
    <div className="text-xs text-[var(--lume-text-secondary)]">
      Nessuno storico trattamenti
    </div>
  );

  return (
    <HoverPopover
      onTriggerClick={onOpen}
      triggerClassName="shrink-0 inline-flex items-center cursor-pointer text-[var(--lume-text-muted)] hover:text-[var(--lume-text)] transition-colors"
      trigger={<Info className="size-3.5" />}
      content={popoverContent}
    />
  );
}
