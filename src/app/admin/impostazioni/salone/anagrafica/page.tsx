import { AnagraficaPanel } from '@/lib/components/admin/settings/AnagraficaPanel';

export default function AnagraficaPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Anagrafica</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Nome, indirizzo e contatti del salone.</p>
      </div>
      <AnagraficaPanel />
    </>
  );
}
