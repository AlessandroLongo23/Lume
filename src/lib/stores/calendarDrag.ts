import { create } from 'zustand';
import type { ConflictResult } from '@/lib/utils/calendar-conflicts';

export type DragKind =
  | 'move-block'      // dragging the whole fiche (header)
  | 'move-service'    // dragging a single service segment
  | 'resize-top'      // dragging the topmost edge of the block
  | 'resize-bottom'   // dragging the bottommost edge of the block
  | 'resize-seam-up'  // dragging the bottom of an upper service at a seam
  | 'resize-seam-down';// dragging the top of a lower service at a seam

export interface PreviewSegment {
  ficheServiceId: string;
  operatorId: string;
  start: Date;
  end: Date;
}

interface CalendarDragState {
  active: boolean;
  kind: DragKind | null;
  ficheId: string | null;
  /** Service ids being directly mutated (excluded from conflict-overlap checks). */
  ficheServiceIds: string[];
  cascade: boolean;
  /** Live preview of where the affected segments would land. */
  preview: PreviewSegment[];
  conflict: ConflictResult;

  begin: (args: {
    kind: DragKind;
    ficheId: string;
    ficheServiceIds: string[];
    cascade?: boolean;
    preview: PreviewSegment[];
    conflict: ConflictResult;
  }) => void;

  update: (args: {
    cascade?: boolean;
    preview: PreviewSegment[];
    conflict: ConflictResult;
  }) => void;

  end: () => void;
}

const IDLE_CONFLICT: ConflictResult = { valid: true, reason: null, conflictingFicheServiceIds: [] };

export const useCalendarDragStore = create<CalendarDragState>((set) => ({
  active: false,
  kind: null,
  ficheId: null,
  ficheServiceIds: [],
  cascade: false,
  preview: [],
  conflict: IDLE_CONFLICT,

  begin: ({ kind, ficheId, ficheServiceIds, cascade = false, preview, conflict }) =>
    set({
      active: true,
      kind,
      ficheId,
      ficheServiceIds,
      cascade,
      preview,
      conflict,
    }),

  update: ({ cascade, preview, conflict }) =>
    set((s) => ({
      cascade: cascade ?? s.cascade,
      preview,
      conflict,
    })),

  end: () =>
    set({
      active: false,
      kind: null,
      ficheId: null,
      ficheServiceIds: [],
      cascade: false,
      preview: [],
      conflict: IDLE_CONFLICT,
    }),
}));
