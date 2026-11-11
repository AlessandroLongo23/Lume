import { ProfiloPanel } from '@/lib/components/admin/settings/ProfiloPanel';

export default function ProfiloPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Profilo</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Le tue informazioni personali e immagine.</p>
      </div>
      <ProfiloPanel />
    </>
  );
}
