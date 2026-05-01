'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCalendarDragStore, type DragKind, type PreviewSegment } from '@/lib/stores/calendarDrag';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFichesStore } from '@/lib/stores/fiches';
import { useOperatorUnavailabilitiesStore } from '@/lib/stores/operatorUnavailabilities';
import { wouldBlockCollide, type ConflictResult } from '@/lib/utils/calendar-conflicts';
import type { FicheService } from '@/lib/types/FicheService';
import type { DaySchedule } from '@/lib/utils/operating-hours';

export interface DropResult {
  kind: DragKind;
  ficheId: string;
  before: PreviewSegment[];
  after: PreviewSegment[];
}

interface UseCalendarDragArgs {
  /**
   * Resolver returning the effective schedule for a given operator, so that
   * per-operator working hours (operators.working_hours) are honored when
   * validating moves and resizes. Falls back to salon hours internally.
   */
  getSchedule: (operatorId: string) => DaySchedule[];
  /** Pixels per slot row (h-8 = 32px in current implementation). */
  pixelsPerSlot: number;
  /** Minutes represented by one slot row. */
  timeStep: number;
  onDrop: (result: DropResult) => void;
}

interface BeginMoveArgs {
  kind: 'move-block' | 'move-service';
  ficheId: string;
  /** All services that move together (block = many; single = 1). Sorted by start_time. */
  services: FicheService[];
  pointer: { clientX: number; clientY: number };
  /** Pixel offset from the visual TOP of the moving block to the cursor at drag start. */
  grabOffsetY: number;
}

interface BeginResizeArgs {
  kind: 'resize-top' | 'resize-bottom' | 'resize-seam-up' | 'resize-seam-down';
  ficheId: string;
  service: FicheService;
  pointer: { clientX: number; clientY: number };
}

const NOW_GUARD_MS = 60_000;

/** Build a fiche_id → client_id map for cross-operator client-overlap detection. */
function getFicheClientMap(): Map<string, string> {
  const fiches = useFichesStore.getState().fiches;
  const map = new Map<string, string>();
  for (const f of fiches) map.set(f.id, f.client_id);
  return map;
}

/** True when every after segment exactly matches its before counterpart. */
function isNoOp(before: PreviewSegment[], after: PreviewSegment[]): boolean {
  if (before.length !== after.length) return false;
  const beforeById = new Map(before.map((b) => [b.ficheServiceId, b]));
  for (const a of after) {
    const b = beforeById.get(a.ficheServiceId);
    if (!b) return false;
    if (
      b.operatorId !== a.operatorId ||
      b.start.getTime() !== a.start.getTime() ||
      b.end.getTime() !== a.end.getTime()
    ) {
      return false;
    }
  }
  return true;
}

interface DragContext {
  kind: DragKind;
  ficheId: string;
  before: PreviewSegment[];
  originPointer: { x: number; y: number };
  lastPointer: { x: number; y: number };
  /** Pixel offset from the moving block's top to the cursor at drag start. Move only. */
  grabOffsetY: number;
  /** For resize: the boundary that's actually moving (start ms or end ms). */
  resizeOriginalTime: number;
  resizeFixedTime: number;
  handlers: {
    onMove: (e: PointerEvent) => void;
    onUp: (e: PointerEvent) => void;
    onKey: ((e: KeyboardEvent) => void) | null;
  };
}

export function useCalendarDrag({ getSchedule, pixelsPerSlot, timeStep, onDrop }: UseCalendarDragArgs) {
  const beginStore = useCalendarDragStore((s) => s.begin);
  const updateStore = useCalendarDragStore((s) => s.update);
  const endStore = useCalendarDragStore((s) => s.end);

  const ctxRef = useRef<DragContext | null>(null);

  const cleanup = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      window.removeEventListener('pointermove', ctx.handlers.onMove);
      window.removeEventListener('pointerup', ctx.handlers.onUp);
      window.removeEventListener('pointercancel', ctx.handlers.onUp);
      if (ctx.handlers.onKey) {
        window.removeEventListener('keydown', ctx.handlers.onKey);
        window.removeEventListener('keyup', ctx.handlers.onKey);
      }
    }
    ctxRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const computeMovePreview = useCallback(
    (ctx: DragContext, clientX: number, clientY: number): { preview: PreviewSegment[]; conflict: ConflictResult } => {
      // Resolve the slot at the BLOCK'S TOP, not the cursor — preserves the relative
      // grab offset so the user can move a block by less than its own height.
      const targetY = clientY - ctx.grabOffsetY;
      const el = document.elementFromPoint(clientX, targetY);
      const slot = el && (el as HTMLElement).closest('[data-cal-slot]') as HTMLElement | null;
      if (!slot) {
        return {
          preview: ctx.before,
          conflict: { valid: false, reason: 'outside-hours', conflictingFicheServiceIds: [] },
        };
      }
      const targetOperatorId = slot.getAttribute('data-cal-operator');
      const targetTimeIso = slot.getAttribute('data-cal-time');
      if (!targetOperatorId || !targetTimeIso) {
        return {
          preview: ctx.before,
          conflict: { valid: false, reason: 'outside-hours', conflictingFicheServiceIds: [] },
        };
      }
      const firstSrc = ctx.before[0];
      const targetTime = new Date(targetTimeIso).getTime();
      const firstSrcStart = firstSrc.start.getTime();
      const deltaMs = targetTime - firstSrcStart;

      const preview: PreviewSegment[] = ctx.before.map((seg) => ({
        ficheServiceId: seg.ficheServiceId,
        operatorId: targetOperatorId,
        start: new Date(seg.start.getTime() + deltaMs),
        end: new Date(seg.end.getTime() + deltaMs),
      }));

      const ficheClientMap = getFicheClientMap();
      const conflict = wouldBlockCollide({
        segments: preview,
        excludeFicheServiceIds: ctx.before.map((s) => s.ficheServiceId),
        allFicheServices: useFicheServicesStore.getState().fiche_services,
        schedule: getSchedule,
        clientId: ficheClientMap.get(ctx.ficheId) ?? null,
        ficheClientMap,
        unavailabilities: useOperatorUnavailabilitiesStore.getState().items,
      });

      return { preview, conflict };
    },
    [getSchedule],
  );

  const computeResizePreview = useCallback(
    (ctx: DragContext, clientY: number, cascade: boolean): { preview: PreviewSegment[]; conflict: ConflictResult } => {
      const deltaPx = clientY - ctx.originPointer.y;
      const deltaSlots = Math.round(deltaPx / pixelsPerSlot);
      const deltaMs = deltaSlots * timeStep * 60_000;

      const seg = ctx.before[0];
      let newStart = seg.start.getTime();
      let newEnd = seg.end.getTime();

      if (ctx.kind === 'resize-top' || ctx.kind === 'resize-seam-down') {
        newStart = ctx.resizeOriginalTime + deltaMs;
        if (newStart >= newEnd) newStart = newEnd - timeStep * 60_000;
      } else if (ctx.kind === 'resize-bottom' || ctx.kind === 'resize-seam-up') {
        newEnd = ctx.resizeOriginalTime + deltaMs;
        if (newEnd <= newStart) newEnd = newStart + timeStep * 60_000;
      }

      const previewAnchor: PreviewSegment = {
        ficheServiceId: seg.ficheServiceId,
        operatorId: seg.operatorId,
        start: new Date(newStart),
        end: new Date(newEnd),
      };

      let preview: PreviewSegment[] = [previewAnchor];

      if (cascade) {
        const allFs = useFicheServicesStore.getState().fiche_services;
        const ficheId = allFs.find((fs) => fs.id === seg.ficheServiceId)?.fiche_id;
        if (ficheId) {
          const sameFicheSameOp = allFs.filter(
            (fs) => fs.fiche_id === ficheId && fs.operator_id === seg.operatorId && fs.id !== seg.ficheServiceId,
          );
          const anchorOriginalStart = ctx.before[0].start.getTime();
          const anchorOriginalEnd = ctx.before[0].end.getTime();
          const shiftRight = ctx.kind === 'resize-bottom' || ctx.kind === 'resize-seam-up';
          const shiftLeft = ctx.kind === 'resize-top' || ctx.kind === 'resize-seam-down';

          for (const fs of sameFicheSameOp) {
            const fsStart = new Date(fs.start_time).getTime();
            const fsEnd = new Date(fs.end_time).getTime();
            const isLater = fsStart >= anchorOriginalEnd;
            const isEarlier = fsEnd <= anchorOriginalStart;
            if ((shiftRight && isLater) || (shiftLeft && isEarlier)) {
              preview.push({
                ficheServiceId: fs.id,
                operatorId: fs.operator_id,
                start: new Date(fsStart + deltaMs),
                end: new Date(fsEnd + deltaMs),
              });
            }
          }
        }
      }

      const now = Date.now();
      preview = preview.map((p) => {
        if (p.start.getTime() < now - NOW_GUARD_MS) {
          return { ...p, start: new Date(now) };
        }
        return p;
      });

      const ficheClientMap = getFicheClientMap();
      const conflict = wouldBlockCollide({
        segments: preview,
        excludeFicheServiceIds: preview.map((p) => p.ficheServiceId),
        allFicheServices: useFicheServicesStore.getState().fiche_services,
        schedule: getSchedule,
        clientId: ficheClientMap.get(ctx.ficheId) ?? null,
        ficheClientMap,
        unavailabilities: useOperatorUnavailabilitiesStore.getState().items,
      });

      return { preview, conflict };
    },
    [getSchedule, pixelsPerSlot, timeStep],
  );

  const beginMove = useCallback(
    (args: BeginMoveArgs) => {
      if (args.services.length === 0) return;
      const before: PreviewSegment[] = args.services.map((fs) => ({
        ficheServiceId: fs.id,
        operatorId: fs.operator_id,
        start: new Date(fs.start_time),
        end: new Date(fs.end_time),
      }));

      const onMove = (e: PointerEvent) => {
        const c = ctxRef.current;
        if (!c) return;
        c.lastPointer = { x: e.clientX, y: e.clientY };
        const { preview, conflict } = computeMovePreview(c, e.clientX, e.clientY);
        updateStore({ preview, conflict });
      };
      const onUp = (e: PointerEvent) => {
        const c = ctxRef.current;
        if (!c) {
          cleanup();
          return;
        }
        const { preview, conflict } = computeMovePreview(c, e.clientX, e.clientY);
        const beforeSnapshot = c.before;
        const kind = c.kind;
        const ficheId = c.ficheId;
        cleanup();
        endStore();
        if (conflict.valid && !isNoOp(beforeSnapshot, preview)) {
          onDrop({ kind, ficheId, before: beforeSnapshot, after: preview });
        }
      };

      ctxRef.current = {
        kind: args.kind as DragKind,
        ficheId: args.ficheId,
        before,
        originPointer: { x: args.pointer.clientX, y: args.pointer.clientY },
        lastPointer: { x: args.pointer.clientX, y: args.pointer.clientY },
        grabOffsetY: args.grabOffsetY,
        resizeOriginalTime: 0,
        resizeFixedTime: 0,
        handlers: { onMove, onUp, onKey: null },
      };

      beginStore({
        kind: args.kind as DragKind,
        ficheId: args.ficheId,
        ficheServiceIds: before.map((s) => s.ficheServiceId),
        preview: before,
        conflict: { valid: true, reason: null, conflictingFicheServiceIds: [] },
      });

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    },
    [beginStore, updateStore, endStore, computeMovePreview, cleanup, onDrop],
  );

  const beginResize = useCallback(
    (args: BeginResizeArgs) => {
      const before: PreviewSegment[] = [{
        ficheServiceId: args.service.id,
        operatorId: args.service.operator_id,
        start: new Date(args.service.start_time),
        end: new Date(args.service.end_time),
      }];

      const start = new Date(args.service.start_time).getTime();
      const end = new Date(args.service.end_time).getTime();
      const isStartEdge = args.kind === 'resize-top' || args.kind === 'resize-seam-down';

      const onMove = (e: PointerEvent) => {
        const c = ctxRef.current;
        if (!c) return;
        c.lastPointer = { x: e.clientX, y: e.clientY };
        const cascade = useCalendarDragStore.getState().cascade;
        const { preview, conflict } = computeResizePreview(c, e.clientY, cascade);
        updateStore({ cascade, preview, conflict });
      };
      const onUp = (e: PointerEvent) => {
        const c = ctxRef.current;
        if (!c) {
          cleanup();
          return;
        }
        const cascade = useCalendarDragStore.getState().cascade;
        const { preview, conflict } = computeResizePreview(c, e.clientY, cascade);
        const beforeSnapshot = c.before;
        const kind = c.kind;
        const ficheId = c.ficheId;
        cleanup();
        endStore();
        if (conflict.valid && !isNoOp(beforeSnapshot, preview)) {
          onDrop({ kind, ficheId, before: beforeSnapshot, after: preview });
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== 'Shift') return;
        const c = ctxRef.current;
        if (!c) return;
        const cascade = e.type === 'keydown';
        const { preview, conflict } = computeResizePreview(c, c.lastPointer.y, cascade);
        updateStore({ cascade, preview, conflict });
      };

      ctxRef.current = {
        kind: args.kind as DragKind,
        ficheId: args.ficheId,
        before,
        originPointer: { x: args.pointer.clientX, y: args.pointer.clientY },
        lastPointer: { x: args.pointer.clientX, y: args.pointer.clientY },
        grabOffsetY: 0,
        resizeOriginalTime: isStartEdge ? start : end,
        resizeFixedTime: isStartEdge ? end : start,
        handlers: { onMove, onUp, onKey },
      };

      beginStore({
        kind: args.kind as DragKind,
        ficheId: args.ficheId,
        ficheServiceIds: [args.service.id],
        cascade: false,
        preview: before,
        conflict: { valid: true, reason: null, conflictingFicheServiceIds: [] },
      });

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      window.addEventListener('keydown', onKey);
      window.addEventListener('keyup', onKey);
    },
    [beginStore, updateStore, endStore, computeResizePreview, cleanup, onDrop],
  );

  return { beginMove, beginResize };
}
