import Link from 'next/link';

export default function PublicSalonNotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-[var(--lume-text)]">Pagina non trovata</h1>
      <p className="mt-3 text-sm text-[var(--lume-text-secondary)]">
        L&apos;indirizzo che hai digitato non corrisponde a nessun salone, oppure le prenotazioni
        online non sono attive in questo momento.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center text-sm text-[var(--lume-accent)] hover:underline"
      >
        Torna alla home
      </Link>
    </main>
  );
}
