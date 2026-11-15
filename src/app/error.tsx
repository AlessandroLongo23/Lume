'use client';

import { useEffect } from 'react';
import { SafeRedirectErrorPage } from '@/lib/components/shared/ui/SafeRedirectErrorPage';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SafeRedirectErrorPage
      code="500"
      title="Qualcosa è andato storto"
      description="Si è verificato un errore imprevisto. Puoi riprovare o tornare a una pagina sicura."
      extraAction={{ label: 'Riprova', onClick: reset }}
    />
  );
}
