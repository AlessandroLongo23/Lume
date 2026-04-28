import { CalendarioSalonePanel } from '@/lib/components/admin/settings/CalendarioSalonePanel';

export default function CalendarioSalonePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Calendario</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Granularità slot e durata appuntamento predefinita.</p>
      </div>
      <CalendarioSalonePanel />
    </>
  );
}
