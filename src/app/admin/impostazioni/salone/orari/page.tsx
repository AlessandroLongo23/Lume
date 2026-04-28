import { SalonePanel } from '@/lib/components/admin/settings/SalonePanel';

export default function OrariPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Orari di apertura</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Configura giorni di apertura e fasce orarie.</p>
      </div>
      <SalonePanel />
    </>
  );
}
