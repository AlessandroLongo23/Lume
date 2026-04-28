import { MagazzinoSettingsPanel } from '@/lib/components/admin/settings/MagazzinoSettingsPanel';

export default function MagazzinoSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Magazzino</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Tracciamento scorte e soglia minima predefinita.</p>
      </div>
      <MagazzinoSettingsPanel />
    </>
  );
}
