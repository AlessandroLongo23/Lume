import { AspettoPanel } from '@/lib/components/admin/settings/AspettoPanel';
import { DefaultVistaPanel } from '@/lib/components/admin/settings/DefaultVistaPanel';
import { TabOrderPanel } from '@/lib/components/admin/settings/TabOrderPanel';

export default function PersonalizzazionePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Personalizzazione</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Tema, viste predefinite e ordine delle schede.
        </p>
      </div>
      <div className="flex flex-col gap-8">
        <section id="aspetto" className="scroll-mt-24 flex flex-col gap-6">
          <AspettoPanel />
        </section>
        <section id="viste" className="scroll-mt-24 flex flex-col gap-6">
          <DefaultVistaPanel />
        </section>
        <section id="schede" className="scroll-mt-24 flex flex-col gap-6">
          <TabOrderPanel />
        </section>
      </div>
    </>
  );
}
