import { SicurezzaPanel } from '@/lib/components/admin/settings/SicurezzaPanel';

export default function SicurezzaPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Sicurezza</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Email, password, autenticazione a due fattori e sessioni.</p>
      </div>
      <SicurezzaPanel />
    </>
  );
}
