import { NotifichePanel } from '@/lib/components/admin/settings/NotifichePanel';

export default function NotifichePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Notifiche</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Gli avvisi che vuoi ricevere mentre lavori in Lume.</p>
      </div>
      <NotifichePanel />
    </>
  );
}
