import { create } from 'zustand';

export interface UnavailabilityCreatePreview {
  operatorId: string;
  /** Date object pointing at the start of the dragged range. */
  start: Date;
  end: Date;
}

interface UnavailabilityCreateState {
  active: boolean;
  preview: UnavailabilityCreatePreview | null;
  begin: (preview: UnavailabilityCreatePreview) => void;
  update: (preview: UnavailabilityCreatePreview) => void;
  end: () => void;
}

export const useUnavailabilityCreateStore = create<UnavailabilityCreateState>((set) => ({
  active: false,
  preview: null,
  begin: (preview) => set({ active: true, preview }),
  update: (preview) => set({ preview }),
  end: () => set({ active: false, preview: null }),
}));
