import { ProfiloPanel } from '@/lib/components/admin/settings/ProfiloPanel';

export default function ProfiloPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Profilo</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Le tue informazioni personali e immagine.</p>
      </div>
      <ProfiloPanel />
    </>
  );
}
