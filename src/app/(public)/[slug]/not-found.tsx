import { PublicHeading } from '@/lib/components/public/PublicHeading';
import { TextLink } from '@/lib/components/shared/ui/TextLink';

export default function PublicSalonNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <PublicHeading subtitle="L'indirizzo che hai digitato non corrisponde a nessun salone, oppure le prenotazioni online non sono attive in questo momento.">
        Pagina non trovata
      </PublicHeading>
      <TextLink href="/" className="mt-6 inline-flex items-center min-h-11 text-sm font-normal">
        Torna alla home
      </TextLink>
    </main>
  );
}
