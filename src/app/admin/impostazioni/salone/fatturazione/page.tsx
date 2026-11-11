import { FatturazionePanel } from '@/lib/components/admin/settings/FatturazionePanel';

export default function FatturazionePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Fatturazione</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Dati fiscali per ricevute e fatture elettroniche.</p>
      </div>
      <FatturazionePanel />
    </>
  );
}
