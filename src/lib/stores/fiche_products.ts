import { create } from 'zustand';
import { supabase } from '@/lib/supabase/client';
import { FicheProduct } from '@/lib/types/FicheProduct';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface FicheProductsState {
  fiche_products: FicheProduct[];
  isLoading: boolean;
  error: string | null;
  fetchFicheProducts: () => Promise<void>;
  addFicheProduct: (ficheProduct: Partial<FicheProduct>) => Promise<FicheProduct>;
  updateFicheProduct: (id: string, updated: Partial<FicheProduct>) => Promise<FicheProduct>;
  deleteFicheProduct: (id: string) => Promise<void>;
}

export const useFicheProductsStore = create<FicheProductsState>((set) => ({
  fiche_products: [],
  isLoading: true,
  error: null,

  fetchFicheProducts: async () => {
    set((s) => ({ ...s, isLoading: true }));
    const { data, error } = await supabase.from('fiche_products').select('*');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ fiche_products: data.map((fp) => new FicheProduct(fp)), isLoading: false, error: null });
  },

  addFicheProduct: async (ficheProduct) => {
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) throw new Error('Nessun salone attivo selezionato.');
    const { data, error } = await supabase
      .from('fiche_products')
      .insert([{ ...ficheProduct, salon_id: activeSalonId }])
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiungere il prodotto alla fiche.');
    const newFicheProduct = new FicheProduct(data);
    set((s) => ({ fiche_products: [...s.fiche_products, newFicheProduct] }));
    return newFicheProduct;
  },

  updateFicheProduct: async (id, updated) => {
    const { data, error } = await supabase
      .from('fiche_products')
      .update(updated)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Impossibile aggiornare il prodotto della fiche.');
    const updatedFp = new FicheProduct(data);
    set((s) => ({ fiche_products: s.fiche_products.map((fp) => (fp.id === id ? updatedFp : fp)) }));
    return updatedFp;
  },

  deleteFicheProduct: async (id) => {
    const { error } = await supabase.from('fiche_products').delete().eq('id', id);
    if (error) throw new Error('Impossibile rimuovere il prodotto dalla fiche.');
    set((s) => ({ fiche_products: s.fiche_products.filter((fp) => fp.id !== id) }));
  },
}));
