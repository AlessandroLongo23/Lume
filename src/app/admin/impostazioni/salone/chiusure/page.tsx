import { ChiusurePanel } from '@/lib/components/admin/settings/ChiusurePanel';

export default function ChiusureSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Chiusure</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Festività, ferie d&apos;agosto, lavori in corso. Le date inserite qui spariscono
          dalla vetrina online e dal calendario.
        </p>
      </div>
      <ChiusurePanel />
    </>
  );
}
