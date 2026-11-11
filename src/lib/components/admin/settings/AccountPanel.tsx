'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Trash2, LogOut, Download } from 'lucide-react';
import { DeleteWorkspaceModal } from '@/lib/components/admin/DeleteWorkspaceModal';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { Button } from '@/lib/components/shared/ui/Button';
import { SettingsCard } from './SettingsCard';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { isOwner, isOperator, canManageSalon } from '@/lib/auth/roles';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

function readImpersonatingCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith('lume-impersonating=1'));
}
const subscribeImpersonation = () => () => {};

export function AccountPanel() {
  const role = useSubscriptionStore((s) => s.role);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
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

  const [exporting, setExporting] = useState(false);

  const performExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Esportazione fallita');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const fileMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = fileMatch?.[1] ?? `lume-export-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      messagePopup.getState().success('Dati scaricati. Conserva il file in luogo sicuro.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Esportazione fallita';
      messagePopup.getState().error(msg);
    } finally {
      setExporting(false);
    }
  };

  const performLeaveSalon = async () => {
    setShowLeaveConfirm(false);
    setLeaving(true);
    try {
      const res = await fetch('/api/account/leave-salon', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Errore');
      }
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
      {canManageSalon(role) && (
        <SettingsCard
          title="I tuoi dati (GDPR)"
          description="Esercita i diritti di accesso e portabilità previsti dagli artt. 15 e 20 GDPR."
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--lume-text)]">Esporta i miei dati</p>
              <p className="text-sm text-[var(--lume-text-secondary)] mt-0.5">
                Scarica un file JSON con tutti i dati operativi del salone (clienti, fiches, ordini, prodotti, …).
              </p>
            </div>
            <Button
              variant="secondary"
              leadingIcon={Download}
              loading={exporting}
              onClick={performExport}
            >
              {exporting ? 'Preparo…' : 'Scarica dati'}
            </Button>
          </div>
        </SettingsCard>
      )}

      {showDangerZone && (
        <SettingsCard
          title="Zona pericolosa"
          description="Le azioni in questa sezione sono irreversibili."
        >
          <div className="flex flex-col divide-y divide-line">
            {isOwner(role) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 first:pt-0">
                <div>
                  <p className="text-sm font-medium text-[var(--lume-text)]">Elimina Salone</p>
                  <p className="text-sm text-[var(--lume-text-secondary)] mt-0.5">
                    {"Cancella definitivamente il salone, tutti i suoi dati e disconnette l'account."}
                  </p>
                </div>
                <Button
                  variant="ghost-destructive"
                  leadingIcon={Trash2}
                  disabled={salonName === null}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Elimina Salone
                </Button>
              </div>
            )}

            {isOperator(role) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 first:pt-0">
                <div>
                  <p className="text-sm font-medium text-[var(--lume-text)]">Esci dal salone</p>
                  <p className="text-sm text-[var(--lume-text-secondary)] mt-0.5">
                    Stacca il tuo account dal salone. La tua scheda operatore viene archiviata.
                  </p>
                </div>
                <Button
                  variant="ghost-destructive"
                  leadingIcon={LogOut}
                  loading={leaving}
                  onClick={() => setShowLeaveConfirm(true)}
                >
                  {leaving ? 'Uscita…' : 'Esci dal salone'}
                </Button>
              </div>
            )}
          </div>
        </SettingsCard>
      )}

      {!isImpersonating && salonName !== null && (
        <DeleteWorkspaceModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          salonName={salonName}
        />
      )}

      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={performLeaveSalon}
        title="Lasciare il salone?"
        description="Perderai immediatamente l'accesso al gestionale."
        confirmLabel="Esci dal salone"
        tone="destructive"
        icon={LogOut}
      />
    </div>
  );
}
