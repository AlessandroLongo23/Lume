import { create } from 'zustand';
import type { ClientSortKey } from '@/lib/utils/clientSort';

interface ViewsState {
  products: 'categories' | 'table';
  services: 'categories' | 'table';
  orders: 'table' | 'calendar';
  clients: 'table' | 'grid';
  clientsSort: ClientSortKey;
  operators: 'table' | 'grid';
  fiches: 'table' | 'grid';
  setView: <K extends keyof Omit<ViewsState, 'setView'>>(
    key: K,
    value: ViewsState[K]
  ) => void;
}

export const useViewsStore = create<ViewsState>((set) => ({
  products: 'categories',
  services: 'categories',
  orders: 'table',
  clients: 'grid',
  clientsSort: 'name',
  operators: 'table',
  fiches: 'table',
  setView: (key, value) => set({ [key]: value }),
}));
