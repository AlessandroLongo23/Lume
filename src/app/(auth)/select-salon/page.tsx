'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ChevronRight, Crown, User } from 'lucide-react';
import { useWorkspaceStore } from '@/lib/stores/workspace';
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { AuthCard } from '@/lib/components/auth/AuthCard';
import { DURATION } from '@/lib/const/motion';

const ease = [0.2, 0, 0, 1] as const;

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
    <AuthCard title="Scegli l'attività" subtitle="In quale salone vuoi lavorare?">
      <ListBox className="-mx-1 p-0 gap-1">
        {businessContexts.map((ctx, i) => (
          <ListRow key={ctx.salonId} asChild>
            <motion.button
              type="button"
              onClick={() => handleSelect(ctx.salonId)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.enter, delay: i * 0.07, ease }}
              className="min-h-14 gap-3 px-3 py-2.5"
            >
              <div className="size-9 rounded-lg bg-hover flex items-center justify-center shrink-0">
                {ctx.role === 'owner'
                  ? <Crown className="size-4 text-[var(--lume-text-secondary)]" />
                  : <User  className="size-4 text-[var(--lume-text-secondary)]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--lume-text)] truncate">{ctx.salonName}</p>
                <p className="text-xs text-[var(--lume-text-secondary)]">
                  {ctx.role === 'owner' ? 'Proprietario' : 'Operatore'}
                </p>
              </div>
              <ChevronRight className="size-4 text-[var(--lume-text-muted)] group-hover/row:text-[var(--lume-text)] shrink-0" />
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
