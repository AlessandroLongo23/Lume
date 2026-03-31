import { create } from 'zustand';

interface StatsState {
  filterType: string;
  filterId: string | null;
  timeRange: number;
  setFilterType: (value: string) => void;
  setFilterId: (value: string | null) => void;
  setTimeRange: (value: number) => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  filterType: 'all',
  filterId: null,
  timeRange: 6,
  setFilterType: (value) => set({ filterType: value }),
  setFilterId: (value) => set({ filterId: value }),
  setTimeRange: (value) => set({ timeRange: value }),
}));
