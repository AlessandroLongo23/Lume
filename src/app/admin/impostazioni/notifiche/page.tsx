import { NotifichePanel } from '@/lib/components/admin/settings/NotifichePanel';

export default function NotifichePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Notifiche</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Gli avvisi che vuoi ricevere mentre lavori in Lume.</p>
      </div>
      <NotifichePanel />
    </>
  );
}
