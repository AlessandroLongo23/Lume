import { TabOrderPanel } from '@/lib/components/admin/settings/TabOrderPanel';

export default function SchedePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Ordine schede</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Riordina e nascondi le schede di Magazzino, Servizi, Coupons, Bilancio e Fiches.
        </p>
      </div>
      <TabOrderPanel />
    </>
  );
}
