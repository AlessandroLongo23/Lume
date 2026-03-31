'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Modal } from './Modal';
import { FormInput } from '../forms/FormInput';
import { FormButton } from '../forms/FormButton';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const redirectPath =
        user?.user_metadata?.role === 'operator' ? '/admin/bilancio' : '/client/prodotti';
      router.push(redirectPath);
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      if (msg?.includes('Invalid login')) msg = 'Email o password errate. Riprova';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backgroundBlur="xs"
      classes="max-w-xs sm:max-w-sm mx-auto"
    >
      <div className="bg-white dark:bg-zinc-800 shadow-2xl rounded-lg">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-700">
          <h3 className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-zinc-100">
            Accedi al tuo account
          </h3>
          <button
            onClick={onClose}
            className="group p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
          </button>
        </div>

        <div className="flex flex-col p-6 gap-4">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <FormInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
              />
              <FormInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
              />
            </div>
            <FormButton type="submit" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </FormButton>
          </form>

          {error && (
            <p className="p-4 bg-red-500/10 text-red-600 text-center text-sm rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
