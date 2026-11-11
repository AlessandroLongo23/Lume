import { AccountPanel } from '@/lib/components/admin/settings/AccountPanel';

export default function EliminaAccountPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Zona pericolosa</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Lascia il salone o, se sei titolare, eliminalo definitivamente.</p>
      </div>
      <AccountPanel />
    </>
  );
}
