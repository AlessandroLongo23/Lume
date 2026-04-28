import { FatturazionePanel } from '@/lib/components/admin/settings/FatturazionePanel';

export default function FatturazionePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Fatturazione</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Dati fiscali per ricevute e fatture elettroniche.</p>
      </div>
      <FatturazionePanel />
    </>
  );
}
