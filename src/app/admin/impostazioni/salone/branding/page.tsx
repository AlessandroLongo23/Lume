import { BrandingPanel } from '@/lib/components/admin/settings/BrandingPanel';

export default function BrandingPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Branding</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">Logo, favicon e colore principale.</p>
      </div>
      <BrandingPanel />
    </>
  );
}
