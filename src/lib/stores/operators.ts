import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Operator } from '@/lib/types/Operator';

interface OperatorsState {
  operators: Operator[];
  showArchived: boolean;
  isLoading: boolean;
  error: string | null;
  selectedOperator: Operator | null;
  fetchOperators: () => Promise<void>;
  addOperator: (operatorData: Partial<Operator>) => Promise<Operator>;
  updateOperator: (operatorId: string, updatedOperator: Partial<Operator>) => Promise<Operator>;
  archiveOperator: (operatorId: string) => Promise<void>;
  restoreOperator: (operatorId: string) => Promise<void>;
  deleteOperator: (operatorId: string) => Promise<void>;
  setSelectedOperator: (operator: Operator | null) => void;
  setShowArchived: (show: boolean) => void;
}

export const useOperatorsStore = create<OperatorsState>((set) => ({
  operators: [],
  showArchived: false,
  isLoading: true,
  error: null,
  selectedOperator: null,

  fetchOperators: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('operators').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ operators: data.map((o) => new Operator(o)), isLoading: false, error: null });
  },

  addOperator: async (operatorData) => {
    const response = await fetch('/api/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: operatorData }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return new Operator(result.user);
  },

  updateOperator: async (operatorId, updatedOperator) => {
    const { data, error } = await supabase
      .from('operators')
      .update(updatedOperator)
      .eq('id', operatorId)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare l\'operatore.');
    return new Operator(data);
  },

  archiveOperator: async (operatorId) => {
    const response = await fetch('/api/operators', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: operatorId, action: 'archive' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  restoreOperator: async (operatorId) => {
    const response = await fetch('/api/operators', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: operatorId, action: 'restore' }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  deleteOperator: async (operatorId) => {
    const response = await fetch('/api/operators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: operatorId }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
  },

  setSelectedOperator: (operator) => set({ selectedOperator: operator }),
  setShowArchived: (show) => set({ showArchived: show }),
}));
