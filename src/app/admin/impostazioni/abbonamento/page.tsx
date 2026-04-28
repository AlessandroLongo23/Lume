import { AbbonamentoPanel } from '@/lib/components/admin/settings/AbbonamentoPanel';

export default function AbbonamentoPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Abbonamento</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Piano, fatturazione e pagamenti.</p>
      </div>
      <AbbonamentoPanel />
    </>
  );
}
