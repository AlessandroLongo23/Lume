import { BrandingPanel } from '@/lib/components/admin/settings/BrandingPanel';

export default function BrandingPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Branding</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Logo, favicon e colore principale.</p>
      </div>
      <BrandingPanel />
    </>
  );
}
