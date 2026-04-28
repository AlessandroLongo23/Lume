import { AspettoPanel } from '@/lib/components/admin/settings/AspettoPanel';

export default function AspettoPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Aspetto</h2>
        <p className="mt-0.5 text-sm text-zinc-500">Tema, densità e barra laterale.</p>
      </div>
      <AspettoPanel />
    </>
  );
}
