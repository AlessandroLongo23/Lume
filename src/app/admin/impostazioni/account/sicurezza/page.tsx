import { SicurezzaPanel } from '@/lib/components/admin/settings/SicurezzaPanel';

export default function SicurezzaPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Sicurezza</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Email, password, autenticazione a due fattori e sessioni.</p>
      </div>
      <SicurezzaPanel />
    </>
  );
}
