import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { Operator } from '@/lib/types/Operator';

interface OperatorsState {
  operators: Operator[];
  isLoading: boolean;
  error: string | null;
  selectedOperator: Operator | null;
  fetchOperators: () => Promise<void>;
  addOperator: (operatorData: Partial<Operator>) => Promise<Operator>;
  updateOperator: (operatorId: string, updatedOperator: Partial<Operator>) => Promise<Operator>;
  deleteOperator: (operatorId: string) => Promise<void>;
  setSelectedOperator: (operator: Operator | null) => void;
}

export const useOperatorsStore = create<OperatorsState>((set) => ({
  operators: [],
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
}));
