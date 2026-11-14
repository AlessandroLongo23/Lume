import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieManageLink } from '@/lib/components/shared/cookieConsent/CookieManageLink';
import { LUME_LEGAL } from '@/lib/const/legal';
import { LEGAL_VERSIONS } from '@/lib/const/legalVersions';

export const metadata: Metadata = {
  title: 'Cookie policy — Lume',
  description: 'Informativa sui cookie utilizzati da Lume e su come gestire le preferenze.',
};

export default function CookiePolicyPage() {
  return (
    <>
      <h1>Cookie policy</h1>
      <p>
        <em>Versione {LEGAL_VERSIONS.cookiePolicy}.</em>
      </p>

      <h2>Cosa sono i cookie</h2>
      <p>
        I cookie sono piccoli file di testo che il sito salva sul tuo dispositivo per ricordare
        informazioni tra una visita e l&apos;altra (ad esempio: la sessione di accesso). Lume
        utilizza esclusivamente cookie tecnici essenziali al funzionamento del Servizio e, solo
        previo consenso esplicito, cookie di analisi.
      </p>
      <p>
        Questa informativa &egrave; redatta in conformit&agrave; alle{' '}
        <em>Linee guida cookie e altri strumenti di tracciamento</em> del Garante per la
        protezione dei dati personali (Provv. 10 giugno 2021, doc. web 9677876, e successivi
        aggiornamenti).
      </p>

      <h2>Cookie utilizzati</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Finalit&agrave;</th>
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
              <code>ph_*</code>
            </td>
            <td>Analisi</td>
            <td>
              PostHog &mdash; statistiche aggregate sull&apos;uso del Servizio. Attivato solo
              dopo il tuo consenso esplicito.
            </td>
            <td>12 mesi</td>
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

      <h2>Statistiche senza cookie</h2>
      <p>
        Per misurare le visite e la velocit&agrave; delle pagine Lume usa{' '}
        <strong>Vercel Web Analytics</strong> e <strong>Vercel Speed Insights</strong>, forniti
        da Vercel Inc., che ospita gi&agrave; il Servizio. Questi strumenti non usano cookie e
        non salvano nulla sul tuo dispositivo, per questo restano attivi anche se rifiuti i
        cookie di analisi. Registrano in forma aggregata la pagina visitata (senza i parametri
        dell&apos;indirizzo), il browser, il sistema operativo, il tipo di dispositivo, il paese
        e i tempi di caricamento. Per contare i visitatori unici Vercel calcola
        un&apos;impronta della richiesta che si azzera ogni giorno, quindi non pu&ograve;
        seguirti da un giorno all&apos;altro n&eacute; tra siti diversi. Maggiori dettagli
        nell&apos;
        <a
          href="https://vercel.com/docs/analytics/privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          informativa di Vercel Web Analytics
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
        &Egrave; inoltre possibile bloccare o cancellare i cookie direttamente dalle impostazioni
        del browser. Disabilitando i cookie tecnici alcune funzionalit&agrave; del Servizio (in
        particolare l&apos;accesso) potrebbero non funzionare correttamente.
      </p>

      <h2>Riferimenti</h2>
      <p>
        Per maggiori dettagli sul trattamento dei dati personali consulta la nostra{' '}
        <Link href="/privacy">Informativa sulla privacy</Link>.
      </p>

      <h2>Contatti</h2>
      <p>
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>
      </p>
    </>
  );
}
