import { NotificheEmailPanel } from '@/lib/components/admin/settings/NotificheEmailPanel';

export default function NotificheEmailPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Notifiche email</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Email automatiche inviate ai clienti per conto del salone.
        </p>
      </div>
      <NotificheEmailPanel />
    </>
  );
}
