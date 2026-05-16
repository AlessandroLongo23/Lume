import { ChiusurePanel } from '@/lib/components/admin/settings/ChiusurePanel';

export default function ChiusureSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Chiusure</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Festività, ferie d&apos;agosto, lavori in corso. Le date inserite qui spariscono
          dalla vetrina online e dal calendario.
        </p>
      </div>
      <ChiusurePanel />
    </>
  );
}
