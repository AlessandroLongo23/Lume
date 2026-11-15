import { AspettoPanel } from '@/lib/components/admin/settings/AspettoPanel';
import { DefaultVistaPanel } from '@/lib/components/admin/settings/DefaultVistaPanel';
import { TabOrderPanel } from '@/lib/components/admin/settings/TabOrderPanel';
import { ClientiTablePanel } from '@/lib/components/admin/settings/ClientiTablePanel';

export default function PersonalizzazionePage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-medium tracking-tight text-[var(--lume-text)]">Personalizzazione</h2>
        <p className="mt-1 text-sm text-[var(--lume-text-secondary)]">
          Tema, viste predefinite, ordine delle schede e promemoria clienti.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <section id="aspetto" className="scroll-mt-24 flex flex-col gap-6 border-t border-line pt-6 first:border-t-0 first:pt-0">
          <AspettoPanel />
        </section>
        <section id="viste" className="scroll-mt-24 flex flex-col gap-6 border-t border-line pt-6 first:border-t-0 first:pt-0">
          <DefaultVistaPanel />
        </section>
        <section id="schede" className="scroll-mt-24 flex flex-col gap-6 border-t border-line pt-6 first:border-t-0 first:pt-0">
          <TabOrderPanel />
        </section>
        <section id="clienti" className="scroll-mt-24 flex flex-col gap-6 border-t border-line pt-6 first:border-t-0 first:pt-0">
          <ClientiTablePanel />
        </section>
      </div>
    </>
  );
}
