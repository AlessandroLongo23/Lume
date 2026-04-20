import type { Metadata } from 'next';
import { resolveSafeRedirect } from '@/lib/auth/safeRedirect';
import { ErrorPageShell } from '@/lib/components/shared/ui/ErrorPageShell';

export const metadata: Metadata = {
  title: 'Accesso non consentito — Lume',
};

export default async function UnauthorizedPage() {
  const { href, label } = await resolveSafeRedirect();

  return (
    <ErrorPageShell
      code="403"
      title="Accesso non consentito"
      description="Non hai i permessi necessari per accedere a questa pagina."
      destinationHref={href}
      destinationLabel={label}
    />
  );
}
