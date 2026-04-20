import type { Metadata } from 'next';
import { resolveSafeRedirect } from '@/lib/auth/safeRedirect';
import { ErrorPageShell } from '@/lib/components/shared/ui/ErrorPageShell';

export const metadata: Metadata = {
  title: 'Pagina non trovata — Lume',
};

export default async function NotFound() {
  const { href, label } = await resolveSafeRedirect();

  return (
    <ErrorPageShell
      code="404"
      title="Pagina non trovata"
      description="La pagina che stai cercando non esiste o è stata spostata."
      destinationHref={href}
      destinationLabel={label}
    />
  );
}
