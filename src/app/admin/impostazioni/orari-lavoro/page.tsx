import { MyWorkingHoursPanel } from '@/lib/components/admin/settings/MyWorkingHoursPanel';

export default function OrariLavoroPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Orari di lavoro</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Configura i giorni e le fasce orarie in cui lavori.
        </p>
      </div>
      <MyWorkingHoursPanel />
    </>
  );
}
