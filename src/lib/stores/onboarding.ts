import { create } from 'zustand';
import type { BusinessType, OriginType } from '@/lib/types/Salon';

interface OnboardingData {
  email:        string;
  password:     string;
  firstName:    string;
  lastName:     string;
  salonName:    string;
  businessType: BusinessType | null;
  origin:       OriginType | null;
  inviteCode:   string;
}

interface OnboardingState extends OnboardingData {
  step:      1 | 2 | 3 | 4;
  direction: 1 | -1;
  isLoading: boolean;
  error:     string | null;

  nextStep:           () => void;
  prevStep:           () => void;
  setField:           <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  reset:              () => void;
  submitRegistration: () => Promise<{ success: boolean }>;
}

const initialData: OnboardingData = {
  email:        '',
  password:     '',
  firstName:    '',
  lastName:     '',
  salonName:    '',
  businessType: null,
  origin:       null,
  inviteCode:   '',
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialData,
  step:      1,
  direction: 1,
  isLoading: false,
  error:     null,

  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 4) as 1 | 2 | 3 | 4, direction: 1 })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) as 1 | 2 | 3 | 4, direction: -1 })),
  setField: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
  reset:    () => set({ ...initialData, step: 1, direction: 1, isLoading: false, error: null }),

  submitRegistration: async () => {
    const { email, password, firstName, lastName, salonName, businessType, origin, inviteCode } = get();
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, firstName, lastName, salonName, businessType, origin, inviteCode }),
      });
      const result = await res.json();

      if (!result.success) {
        set({ isLoading: false, error: result.error ?? 'Registrazione fallita. Riprova.' });
        return { success: false };
      }

      set({ isLoading: false });
      return { success: true };
    } catch {
      set({ isLoading: false, error: 'Errore di rete. Controlla la connessione e riprova.' });
      return { success: false };
    }
  },
}));
