'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Briefcase, ShieldCheck, User } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { AuthCard } from '@/lib/components/auth/AuthCard';
import { DURATION } from '@/lib/const/motion';

const ease = [0.2, 0, 0, 1] as const;

// The workspaces are list rows laid out as tiles: the hover glide moves
// between them like in any other list. Each tile wears the card ring at rest
// (transparent fill, so the glide shows through on hover).
const workspaceTileClass = 'surface-card bg-transparent flex-col justify-center gap-3 p-5 min-h-33';

const cardVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, delay: i * 0.1, ease },
  }),
};

export default function SelectWorkspacePage() {
  const router = useRouter();
  const { businessContexts, clientContexts, isAdmin, isLoading, resolve, setActiveSalon, selectWorkspace } =
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

  function handlePlatform() {
    router.push('/platform');
  }

  const businessLabel =
    businessContexts.length === 1
      ? businessContexts[0].salonName
      : `${businessContexts.length} attività`;

  const clientLabel =
    clientContexts.length === 1
      ? clientContexts[0].salonName
      : `${clientContexts.length} saloni seguiti`;

  const hasBusiness = businessContexts.length > 0;
  const hasClient   = clientContexts.length > 0;

  const tiles = [
    isAdmin && { key: 'platform', icon: ShieldCheck, title: 'Piattaforma', detail: 'Dashboard super-admin', onClick: handlePlatform },
    hasBusiness && { key: 'business', icon: Briefcase, title: 'Gestisci il Business', detail: businessLabel, onClick: handleBusiness },
    hasClient && { key: 'client', icon: User, title: 'Area Personale', detail: clientLabel, onClick: handleClient },
  ].filter((t) => t !== false);

  const gridCols =
    tiles.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : tiles.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1';

  return (
    <AuthCard title="Dove vuoi andare?" subtitle="Seleziona il tuo spazio di lavoro" align="center">
      <ListBox className={`grid ${gridCols} gap-2 p-0`}>
        {tiles.map(({ key, icon: Icon, title, detail, onClick }, i) => (
          <ListRow key={key} asChild>
            <motion.button
              type="button"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              onClick={onClick}
              className={workspaceTileClass}
            >
              <div className="size-10 rounded-xl bg-hover flex items-center justify-center shrink-0">
                <Icon className="size-5 text-[var(--lume-text-secondary)]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[var(--lume-text)] leading-tight">{title}</p>
                <p className="text-xs text-[var(--lume-text-secondary)] mt-1 leading-tight">{detail}</p>
              </div>
            </motion.button>
          </ListRow>
        ))}
      </ListBox>

      {isLoading && (
        <p className="text-center text-sm text-[var(--lume-text-muted)] mt-4">Caricamento…</p>
      )}
    </AuthCard>
  );
}
