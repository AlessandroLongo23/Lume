import { CalendarioSalonePanel } from '@/lib/components/admin/settings/CalendarioSalonePanel';

export default function CalendarioSalonePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Calendario</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Granularità slot e durata appuntamento predefinita.</p>
      </div>
      <CalendarioSalonePanel />
    </>
  );
}
