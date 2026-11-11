import { DefaultFormPanel } from '@/lib/components/admin/settings/DefaultFormPanel';

export default function DefaultFormPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Default form</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Valori iniziali per i form di servizi, coupon, gift card, abbonamenti e clienti.
        </p>
      </div>
      <DefaultFormPanel />
    </>
  );
}
