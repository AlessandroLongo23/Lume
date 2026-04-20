'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
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
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#fafafa',
          color: '#18181b',
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 600,
              color: '#6366F1',
              marginBottom: '0.5rem',
            }}
          >
            500
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.75rem',
            }}
          >
            Qualcosa è andato storto
          </h1>
          <p style={{ color: '#52525b', margin: '0 0 2rem' }}>
            Si è verificato un errore critico. Prova a ricaricare la pagina o
            torna alla homepage.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: '#6366F1',
                color: 'white',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Ricarica
            </button>
            <Link
              href="/"
              style={{
                borderRadius: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: 'white',
                color: '#18181b',
                fontWeight: 500,
                textDecoration: 'none',
                border: '1px solid #e4e4e7',
              }}
            >
              Torna alla homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
