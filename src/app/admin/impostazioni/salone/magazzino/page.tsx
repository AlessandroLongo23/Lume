import { MagazzinoSettingsPanel } from '@/lib/components/admin/settings/MagazzinoSettingsPanel';

export default function MagazzinoSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Magazzino</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Tracciamento scorte e soglia minima predefinita.</p>
      </div>
      <MagazzinoSettingsPanel />
    </>
  );
}
