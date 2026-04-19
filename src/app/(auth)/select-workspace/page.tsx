'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Briefcase, User } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/stores/workspace';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease },
  }),
};

export default function SelectWorkspacePage() {
  const router = useRouter();
  const { businessContexts, clientContexts, isLoading, resolve, setActiveSalon, selectWorkspace } =
    useWorkspaceStore();

  // Re-hydrate after hard refresh (store is empty)
  useEffect(() => {
    if (businessContexts.length === 0 && clientContexts.length === 0 && !isLoading) {
      resolve();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleBusiness() {
    selectWorkspace('business');
    if (businessContexts.length === 1) {
      await setActiveSalon(businessContexts[0].salonId);
      router.push('/admin/calendario');
    } else {
      router.push('/select-salon');
    }
  }

  function handleClient() {
    selectWorkspace('client');
    router.push('/client-dashboard');
  }

  const businessLabel =
    businessContexts.length === 1
      ? businessContexts[0].salonName
      : `${businessContexts.length} attività`;

  const clientLabel =
    clientContexts.length === 1
      ? clientContexts[0].salonName
      : `${clientContexts.length} saloni seguiti`;

  return (
    <>
      <motion.div
        className="mb-6 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
      >
        <h1 className="text-xl font-semibold text-zinc-900">Dove vuoi andare?</h1>
        <p className="text-sm text-zinc-500 mt-1">Seleziona il tuo spazio di lavoro</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={handleBusiness}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-zinc-200
            bg-white text-left cursor-pointer transition-all duration-200
            hover:border-primary/40 hover:bg-primary/40 hover:shadow-sm
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-primary-hover" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-900 leading-tight">Gestisci il Business</p>
            <p className="text-xs text-zinc-500 mt-1 leading-tight">{businessLabel}</p>
          </div>
        </motion.button>

        <motion.button
          type="button"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={handleClient}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-zinc-200
            bg-white text-left cursor-pointer transition-all duration-200
            hover:border-primary/40 hover:bg-primary/40 hover:shadow-sm
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-900 leading-tight">Area Personale</p>
            <p className="text-xs text-zinc-500 mt-1 leading-tight">{clientLabel}</p>
          </div>
        </motion.button>
      </div>

      {isLoading && (
        <p className="text-center text-sm text-zinc-400 mt-4">Caricamento...</p>
      )}
    </>
  );
}
