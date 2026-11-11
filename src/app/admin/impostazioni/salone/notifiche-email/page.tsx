import { NotificheEmailPanel } from '@/lib/components/admin/settings/NotificheEmailPanel';

export default function NotificheEmailPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Notifiche email</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Email automatiche inviate ai clienti per conto del salone.
        </p>
      </div>
      <NotificheEmailPanel />
    </>
  );
}
