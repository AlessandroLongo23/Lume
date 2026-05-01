import { MyWorkingHoursPanel } from '@/lib/components/admin/settings/MyWorkingHoursPanel';

export default function OrariLavoroPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Orari di lavoro</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Configura i giorni e le fasce orarie in cui lavori.
        </p>
      </div>
      <MyWorkingHoursPanel />
    </>
  );
}
