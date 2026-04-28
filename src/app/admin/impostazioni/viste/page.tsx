import { DefaultVistaPanel } from '@/lib/components/admin/settings/DefaultVistaPanel';

export default function VistePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Default vista</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Scegli la modalità predefinita per ogni pagina.</p>
      </div>
      <DefaultVistaPanel />
    </>
  );
}
