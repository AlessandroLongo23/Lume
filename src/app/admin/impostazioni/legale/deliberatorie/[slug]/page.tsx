'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PrintableDocument } from '@/lib/components/admin/legale/PrintableDocument';
import { getDeliberatoria } from '@/lib/legal/deliberatorie';
import { InformativaCliente } from '@/lib/components/admin/legale/templates/InformativaCliente';
import { ConsensoDatiParticolari } from '@/lib/components/admin/legale/templates/ConsensoDatiParticolari';
import { ConsensoFoto } from '@/lib/components/admin/legale/templates/ConsensoFoto';
import { ConsensoMarketing } from '@/lib/components/admin/legale/templates/ConsensoMarketing';
import { ConsensoFedelta } from '@/lib/components/admin/legale/templates/ConsensoFedelta';
import { ConsensoMinore } from '@/lib/components/admin/legale/templates/ConsensoMinore';

const TEMPLATES = {
  'informativa-cliente':         InformativaCliente,
  'consenso-dati-particolari':   ConsensoDatiParticolari,
  'consenso-foto':               ConsensoFoto,
  'consenso-marketing':          ConsensoMarketing,
  'consenso-fedelta':            ConsensoFedelta,
  'consenso-minore':             ConsensoMinore,
} as const;

export default function DeliberatoriaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const meta = getDeliberatoria(slug);
  const Template = TEMPLATES[slug as keyof typeof TEMPLATES];
  if (!meta || !Template) notFound();

  return (
    <>
      <Link
        href="/admin/impostazioni/legale/deliberatorie"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 print:hidden"
      >
        <ArrowLeft className="size-3.5" />
        Torna alle deliberatorie
      </Link>

      <PrintableDocument
        documentTitle={meta.title}
        documentSubtitle={`${meta.legalBasis} · ${meta.description}`}
      >
        <Template />
      </PrintableDocument>
    </>
  );
}
