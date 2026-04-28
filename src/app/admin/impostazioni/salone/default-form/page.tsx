import { DefaultFormPanel } from '@/lib/components/admin/settings/DefaultFormPanel';

export default function DefaultFormPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Default form</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Valori iniziali per i form di servizi, coupon, gift card, abbonamenti e clienti.
        </p>
      </div>
      <DefaultFormPanel />
    </>
  );
}
