import { MioProfiloOperatorePanel } from '@/lib/components/admin/settings/MioProfiloOperatorePanel';

export default function MioProfiloOperatorePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Mio profilo operatore</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          La scheda operatore visibile ai clienti e usata in fiches e calendario.
        </p>
      </div>
      <MioProfiloOperatorePanel />
    </>
  );
}
