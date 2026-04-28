'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { TriangleAlert, Trash2, LogOut } from 'lucide-react';
import { DeleteWorkspaceModal } from '@/lib/components/admin/DeleteWorkspaceModal';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { isOwner, isOperator } from '@/lib/auth/roles';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

function readImpersonatingCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('lume-impersonating=1'));
}
const subscribeImpersonation = () => () => {};

export function AccountPanel() {
  const role = useSubscriptionStore((s) => s.role);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [salonName, setSalonName] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const isImpersonating = useSyncExternalStore(
    subscribeImpersonation,
    readImpersonatingCookie,
    () => false,
  );

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (typeof data.name === 'string') setSalonName(data.name); })
      .catch(() => {});
  }, []);

  const onLeaveSalon = async () => {
    if (!confirm('Lasciare il salone? Perderai immediatamente l\'accesso al gestionale.')) return;
    setLeaving(true);
    try {
      const res = await fetch('/api/account/leave-salon', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Errore');
      }
      // Clean sign-out so the next request sees a fresh state.
      await fetch('/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante l\'operazione';
      messagePopup.getState().error(msg);
      setLeaving(false);
    }
  };

  const showDangerZone = !isImpersonating && (isOwner(role) || isOperator(role));

  return (
    <div className="flex flex-col gap-6">
      {showDangerZone && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/40">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-red-500" />
              <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Zona Pericolosa</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Le azioni in questa sezione sono irreversibili.
            </p>
          </div>

          {isOwner(role) && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Elimina Salone</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {"Cancella definitivamente il salone, tutti i suoi dati e disconnette l'account."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={salonName === null}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-4" />
                  Elimina Salone
                </button>
              </div>
            </div>
          )}

          {isOperator(role) && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Esci dal salone</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Stacca il tuo account dal salone. La tua scheda operatore viene archiviata.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLeaveSalon}
                  disabled={leaving}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <LogOut className="size-4" />
                  {leaving ? 'Uscita…' : 'Esci dal salone'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isImpersonating && salonName !== null && (
        <DeleteWorkspaceModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          salonName={salonName}
        />
      )}
    </div>
  );
}
