import { AccountPanel } from '@/lib/components/admin/settings/AccountPanel';

export default function EliminaAccountPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Zona pericolosa</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Lascia il salone o, se sei titolare, eliminalo definitivamente.</p>
      </div>
      <AccountPanel />
    </>
  );
}
