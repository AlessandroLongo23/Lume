import type { Metadata } from 'next';
import { SafeRedirectErrorPage } from '@/lib/components/shared/ui/SafeRedirectErrorPage';

export const metadata: Metadata = {
  title: 'Pagina non trovata — Lume',
};

// Keep this file free of cookies(), headers() and server-side auth: Next
// renders the root not-found boundary inside every route, so one cookie read
// here turns every page in the app into a per-request server render.
export default function NotFound() {
  return (
    <SafeRedirectErrorPage
      code="404"
      title="Pagina non trovata"
      description="La pagina che stai cercando non esiste o è stata spostata."
    />
  );
}
