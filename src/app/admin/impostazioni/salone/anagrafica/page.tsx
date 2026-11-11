import { AnagraficaPanel } from '@/lib/components/admin/settings/AnagraficaPanel';

export default function AnagraficaPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Anagrafica</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Nome, indirizzo e contatti del salone.</p>
      </div>
      <AnagraficaPanel />
    </>
  );
}
