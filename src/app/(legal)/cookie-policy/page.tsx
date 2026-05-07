import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieManageLink } from '@/lib/components/shared/cookieConsent/CookieManageLink';

export const metadata: Metadata = {
  title: 'Cookie policy — Lume',
  description:
    'Informativa sui cookie utilizzati da Lume e su come gestire le preferenze.',
};

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Cookie policy</h1>
      <p>
        <em>Ultimo aggiornamento: 3 maggio 2026.</em>
      </p>

      <h2>Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file di testo che il sito salva sul tuo dispositivo per ricordare
        informazioni tra una visita e l&apos;altra (ad esempio: la sessione di accesso). Lume usa
        cookie tecnici essenziali al funzionamento del Servizio e, solo previo consenso, cookie di
        analisi.
      </p>

      {/* TODO: lawyer review — verify cookie list before launch */}

      <h2>Cookie utilizzati</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Finalità</th>
            <th>Durata</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sb-*-auth-token</code>
            </td>
            <td>Necessario</td>
            <td>Sessione di autenticazione Supabase.</td>
            <td>Durata della sessione</td>
          </tr>
          <tr>
            <td>
              <code>lume-active-salon-id</code>
            </td>
            <td>Necessario</td>
            <td>
              Identifica il salone attivo per gli amministratori della piattaforma in fase di
              impersonificazione.
            </td>
            <td>30 giorni</td>
          </tr>
          <tr>
            <td>
              <code>lume-impersonating</code>
            </td>
            <td>Necessario</td>
            <td>Segnala l&apos;impersonificazione attiva al client per mostrare il banner.</td>
            <td>30 giorni</td>
          </tr>
          <tr>
            <td>
              <code>lume-cookie-consent</code>
            </td>
            <td>Necessario</td>
            <td>Memorizza la tua scelta sui cookie di analisi.</td>
            <td>12 mesi</td>
          </tr>
          <tr>
            <td>
              <em>(strumenti di analisi)</em>
            </td>
            <td>Analisi</td>
            <td>
              Non attualmente attivi. Saranno attivati solo dopo il tuo consenso esplicito per
              capire l&apos;uso aggregato del Servizio.
            </td>
            <td>—</td>
          </tr>
        </tbody>
      </table>

      <h2>Cookie di terze parti</h2>
      <p>
        Quando avvii la sottoscrizione di un abbonamento sei reindirizzato sul dominio di{' '}
        <strong>Stripe Payments Europe Ltd.</strong>, che imposta i propri cookie tecnici per
        prevenire frodi e mantenere la sessione di pagamento. Questi cookie sono soggetti
        all&apos;
        <a
          href="https://stripe.com/legal/cookies-policy"
          target="_blank"
          rel="noreferrer"
        >
          informativa cookie di Stripe
        </a>
        .
      </p>

      <h2>Come gestire le preferenze</h2>
      <p>
        Puoi modificare in qualsiasi momento la tua scelta sui cookie di analisi tramite il
        pulsante qui sotto:
      </p>
      <p>
        <CookieManageLink variant="secondary">Gestisci cookie</CookieManageLink>
      </p>
      <p>
        È inoltre possibile bloccare o cancellare i cookie direttamente dalle impostazioni del
        browser. Disabilitando i cookie tecnici alcune funzionalità del Servizio (in particolare
        l&apos;accesso) potrebbero non funzionare correttamente.
      </p>

      <h2>Riferimenti</h2>
      <p>
        Per maggiori dettagli sul trattamento dei dati personali consulta la nostra{' '}
        <Link href="/privacy">informativa sulla privacy</Link>.
      </p>

      <h2>Contatti</h2>
      <p>
        Per qualsiasi domanda: <a href="mailto:info@lumeapp.it">info@lumeapp.it</a>.
      </p>
    </>
  );
}
