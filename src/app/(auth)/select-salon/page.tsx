'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronRight, Crown, User } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/stores/workspace';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function SelectSalonPage() {
  const router = useRouter();
  const { businessContexts, isLoading, resolve, setActiveSalon } = useWorkspaceStore();

  useEffect(() => {
    if (businessContexts.length === 0 && !isLoading) {
      // Re-hydrate on hard refresh
      resolve().then((result) => {
        if (result.businessContexts.length === 1) {
          setActiveSalon(result.businessContexts[0].salonId).then(() => {
            router.push('/admin/calendario');
          });
        }
      });
    } else if (businessContexts.length === 1 && !isLoading) {
      // Only one option — skip the list and go directly
      setActiveSalon(businessContexts[0].salonId).then(() => {
        router.push('/admin/calendario');
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(salonId: string) {
    await setActiveSalon(salonId);
    router.push('/admin/calendario');
  }

  return (
    <>
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <h1 className="text-xl font-semibold text-zinc-900">Scegli l&apos;attività</h1>
        <p className="text-sm text-zinc-500 mt-1">In quale salone vuoi lavorare?</p>
      </motion.div>

      <div className="space-y-2">
        {businessContexts.map((ctx, i) => (
          <motion.button
            key={ctx.salonId}
            type="button"
            onClick={() => handleSelect(ctx.salonId)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07, ease }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-zinc-200
              bg-white text-left cursor-pointer transition-all duration-200
              hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-sm
              focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
              {ctx.role === 'owner'
                ? <Crown className="w-4 h-4 text-indigo-600" />
                : <User  className="w-4 h-4 text-zinc-500" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{ctx.salonName}</p>
              <p className="text-xs text-zinc-500">
                {ctx.role === 'owner' ? 'Proprietario' : 'Operatore'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
          </motion.button>
        ))}
      </div>

      {isLoading && (
        <p className="text-center text-sm text-zinc-400 mt-4">Caricamento...</p>
      )}
    </>
  );
}
