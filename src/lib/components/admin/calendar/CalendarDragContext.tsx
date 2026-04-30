'use client';

import { createContext, useContext } from 'react';
import type { FicheService } from '@/lib/types/FicheService';

export interface CalendarDragContextValue {
  beginMove: (args: {
    kind: 'move-block' | 'move-service';
    ficheId: string;
    services: FicheService[];
    pointer: { clientX: number; clientY: number };
    /** Pixel offset from the block's visual top to the cursor at drag start. */
    grabOffsetY: number;
  }) => void;
  beginResize: (args: {
    kind: 'resize-top' | 'resize-bottom' | 'resize-seam-up' | 'resize-seam-down';
    ficheId: string;
    service: FicheService;
    pointer: { clientX: number; clientY: number };
  }) => void;
}

const noop = () => { /* noop */ };

const defaultValue: CalendarDragContextValue = {
  beginMove: noop,
  beginResize: noop,
};

export const CalendarDragContext = createContext<CalendarDragContextValue>(defaultValue);

export function useCalendarDragContext(): CalendarDragContextValue {
  return useContext(CalendarDragContext);
}
