import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy — Lume',
  description:
    'Informativa sulla privacy di Lume — come trattiamo i dati personali ai sensi del GDPR.',
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Informativa sulla privacy</h1>
      <p>
        <em>Ultimo aggiornamento: 3 maggio 2026.</em>
      </p>
      <p>
        Questa informativa descrive come Lume tratta i dati personali degli utenti dei suoi servizi
        (di seguito &laquo;<strong>Servizio</strong>&raquo;), in conformità al Regolamento (UE)
        2016/679 (&laquo;GDPR&raquo;) e alla normativa italiana applicabile.
      </p>

      {/* TODO: lawyer review — replace placeholder details before launch */}

      <h2>Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento è <strong>Lume</strong>, contattabile all&apos;indirizzo{' '}
        <a href="mailto:info@lumeapp.it">info@lumeapp.it</a>. Ragione sociale, sede legale e
        partita IVA verranno indicati prima dell&apos;apertura commerciale.
      </p>

      <h2>Dati raccolti</h2>
      <ul>
        <li>
          <strong>Dati di registrazione</strong>: nome, cognome, email, password (memorizzata in
          forma cifrata).
        </li>
        <li>
          <strong>Dati del salone</strong>: ragione sociale, indirizzo, contatti, configurazione
          dei servizi e degli operatori.
        </li>
        <li>
          <strong>Dati operativi</strong>: clienti, appuntamenti, prodotti, ordini, dati contabili
          inseriti dall&apos;utente nel gestionale.
        </li>
        <li>
          <strong>Dati di pagamento</strong>: gestiti direttamente da Stripe Payments Europe Ltd.;
          Lume non memorizza dati di carte di credito.
        </li>
        <li>
          <strong>Dati tecnici</strong>: indirizzo IP, user-agent, log applicativi necessari al
          funzionamento e alla sicurezza del Servizio.
        </li>
      </ul>

      <h2>Finalità del trattamento</h2>
      <ul>
        <li>Erogazione del Servizio e gestione del rapporto contrattuale.</li>
        <li>Adempimenti legali, fiscali e contabili.</li>
        <li>Sicurezza, prevenzione frodi e diagnostica tecnica.</li>
        <li>
          Comunicazioni di servizio (es. avvisi su scadenza abbonamento, modifiche al Servizio).
        </li>
        <li>
          Analisi statistiche aggregate sull&apos;uso del Servizio, solo previo consenso
          dell&apos;utente.
        </li>
      </ul>

      <h2>Base giuridica</h2>
      <p>
        Il trattamento si fonda sull&apos;esecuzione del contratto (art. 6.1.b GDPR), su obblighi
        di legge (art. 6.1.c GDPR), sul legittimo interesse alla sicurezza del Servizio (art.
        6.1.f GDPR) e, per i cookie di analisi, sul consenso (art. 6.1.a GDPR).
      </p>

      <h2>Conservazione</h2>
      <p>
        I dati operativi sono conservati per la durata dell&apos;abbonamento e per i successivi
        dieci anni ai fini fiscali e contabili. I log tecnici sono conservati per un massimo di 12
        mesi. {/* TODO: lawyer review — confirm retention windows */}
      </p>

      <h2>Comunicazione a terzi</h2>
      <p>I dati sono comunicati ai seguenti responsabili del trattamento:</p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> — hosting database, autenticazione, archiviazione file.
        </li>
        <li>
          <strong>Stripe Payments Europe Ltd.</strong> — elaborazione dei pagamenti e gestione
          degli abbonamenti.
        </li>
        <li>
          <strong>Resend Inc.</strong> — invio di email transazionali.
        </li>
        <li>
          <strong>Vercel Inc.</strong> — hosting dell&apos;applicazione.
        </li>
      </ul>
      <p>
        Trasferimenti extra-UE avvengono in presenza di adeguate garanzie (clausole contrattuali
        standard).
      </p>

      <h2>Diritti dell&apos;interessato</h2>
      <p>L&apos;utente può esercitare in qualsiasi momento i diritti previsti dagli artt. 15–22 GDPR:</p>
      <ul>
        <li>accesso, rettifica, cancellazione;</li>
        <li>limitazione e opposizione al trattamento;</li>
        <li>portabilità dei dati;</li>
        <li>revoca del consenso prestato per i cookie di analisi;</li>
        <li>
          reclamo all&apos;Autorità Garante per la protezione dei dati personali (
          <a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">
            garanteprivacy.it
          </a>
          ).
        </li>
      </ul>
      <p>
        Le richieste vanno indirizzate a{' '}
        <a href="mailto:info@lumeapp.it">info@lumeapp.it</a>.
      </p>

      <h2>Modifiche</h2>
      <p>
        Lume può aggiornare questa informativa per riflettere modifiche normative o del Servizio.
        Gli utenti saranno informati delle modifiche sostanziali tramite email o avviso in app.
      </p>

      <h2>Contatti</h2>
      <p>
        Per qualsiasi domanda relativa a questa informativa: {' '}
        <a href="mailto:info@lumeapp.it">info@lumeapp.it</a>.
      </p>
    </>
  );
}
