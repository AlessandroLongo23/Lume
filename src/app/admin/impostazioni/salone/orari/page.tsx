import { SalonePanel } from '@/lib/components/admin/settings/SalonePanel';

export default function OrariPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Orari di apertura</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Configura giorni di apertura e fasce orarie.</p>
      </div>
      <SalonePanel />
    </>
  );
}
