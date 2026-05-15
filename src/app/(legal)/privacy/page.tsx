import type { Metadata } from 'next';
import Link from 'next/link';
import { LUME_LEGAL, formatLumeAddress, formatLumeIdentity } from '@/lib/const/legal';
import { LEGAL_VERSIONS } from '@/lib/const/legalVersions';

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
        <em>Versione {LEGAL_VERSIONS.privacy}.</em>
      </p>
      <p>
        Questa informativa descrive come Lume tratta i dati personali degli utenti del Servizio
        ai sensi del Regolamento (UE) 2016/679 (&laquo;GDPR&raquo;), del D.lgs. 196/2003
        (&laquo;Codice Privacy&raquo;) e della normativa danese applicabile, in conformit&agrave;
        all&apos;art. 13 GDPR.
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Il titolare del trattamento &egrave; <strong>{formatLumeIdentity()}</strong>
        {LUME_LEGAL.address.country
          ? `, con sede in ${formatLumeAddress() || LUME_LEGAL.address.country}`
          : ''}
        . Per qualsiasi richiesta relativa ai dati personali:{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>.
      </p>

      <h2>2. Responsabile della protezione dei dati (DPO)</h2>
      <p>
        Lume non ha designato un Responsabile della protezione dei dati: i requisiti di nomina
        obbligatoria previsti dall&apos;art. 37 GDPR (autorit&agrave; pubblica, monitoraggio
        sistematico su larga scala, trattamento su larga scala di dati particolari) non
        ricorrono al volume attuale del Servizio. Le richieste degli interessati sono gestite
        direttamente da Lume all&apos;indirizzo{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>.
      </p>

      <h2>3. Categorie di dati, finalit&agrave; e basi giuridiche</h2>
      <table>
        <thead>
          <tr>
            <th>Categoria di dati</th>
            <th>Finalit&agrave;</th>
            <th>Base giuridica</th>
            <th>Conservazione</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account: nome, cognome, email, password cifrata</td>
            <td>Autenticazione, erogazione del Servizio, comunicazioni di servizio</td>
            <td>Esecuzione del contratto (art. 6.1.b GDPR)</td>
            <td>Per la durata dell&apos;abbonamento</td>
          </tr>
          <tr>
            <td>
              Dati del salone: ragione sociale, partita IVA, indirizzo, contatti, configurazione
            </td>
            <td>Erogazione del Servizio, fatturazione</td>
            <td>Esecuzione del contratto (art. 6.1.b GDPR), obbligo di legge (art. 6.1.c GDPR)</td>
            <td>Durata abbonamento + 10 anni (art. 2220 c.c. per documentazione contabile)</td>
          </tr>
          <tr>
            <td>
              Dati operativi inseriti nel gestionale: clienti del salone, appuntamenti, fiches,
              prodotti, ordini
            </td>
            <td>Erogazione del Servizio per conto del salone (Lume = Responsabile, art. 28 GDPR)</td>
            <td>Esecuzione del contratto fra il salone e i suoi clienti (art. 6.1.b GDPR)</td>
            <td>Durata abbonamento + 10 anni; cancellazione su richiesta del salone</td>
          </tr>
          <tr>
            <td>Dati di pagamento</td>
            <td>Elaborazione del canone di abbonamento</td>
            <td>Esecuzione del contratto (art. 6.1.b GDPR)</td>
            <td>Gestiti direttamente da Stripe; Lume non memorizza dati di carta</td>
          </tr>
          <tr>
            <td>Log tecnici: indirizzo IP, user-agent, log di errore</td>
            <td>Sicurezza, prevenzione frodi, diagnostica</td>
            <td>Legittimo interesse (art. 6.1.f GDPR)</td>
            <td>12 mesi</td>
          </tr>
          <tr>
            <td>Backup di sicurezza</td>
            <td>Continuit&agrave; operativa</td>
            <td>Legittimo interesse (art. 6.1.f GDPR)</td>
            <td>30 giorni a rotazione</td>
          </tr>
          <tr>
            <td>Cookie di analisi</td>
            <td>Statistiche aggregate sull&apos;uso del Servizio</td>
            <td>Consenso (art. 6.1.a GDPR), revocabile in qualsiasi momento</td>
            <td>Vedi <Link href="/cookie-policy">Cookie policy</Link></td>
          </tr>
        </tbody>
      </table>

      <h2>4. Lume come Responsabile del trattamento</h2>
      <p>
        Quando il salone (Cliente) inserisce nel Servizio dati relativi ai propri clienti finali,
        operatori e fornitori, il Cliente agisce come <strong>Titolare del trattamento</strong> e
        Lume agisce come <strong>Responsabile del trattamento</strong> ai sensi dell&apos;art. 28
        GDPR. I termini di tale rapporto sono regolati dal{' '}
        <Link href="/dpa">Data Processing Agreement (DPA)</Link> accettato in fase di
        registrazione.
      </p>

      <h2>5. Sub-responsabili (sub-processors)</h2>
      <p>
        Lume si avvale dei seguenti sub-responsabili per fornire il Servizio. L&apos;elenco
        aggiornato &egrave; pubblicato sulla pagina{' '}
        <Link href="/sub-processors">Sub-processors</Link>; le modifiche vengono comunicate ai
        Clienti con preavviso di almeno 30 giorni.
      </p>
      <ul>
        <li>
          <strong>Supabase Inc.</strong> (USA) — database, autenticazione, archiviazione file.
        </li>
        <li>
          <strong>Vercel Inc.</strong> (USA) — hosting dell&apos;applicazione.
        </li>
        <li>
          <strong>Stripe Payments Europe Ltd.</strong> (Irlanda) — elaborazione dei pagamenti.
        </li>
        <li>
          <strong>Resend Inc.</strong> (USA) — invio di email transazionali.
        </li>
      </ul>

      <h2>6. Trasferimenti extra-UE</h2>
      <p>
        Alcuni sub-responsabili (Supabase, Vercel, Resend) hanno sede negli Stati Uniti. I
        trasferimenti avvengono sulla base delle <em>Clausole Contrattuali Standard</em>{' '}
        approvate dalla Commissione Europea (decisione di esecuzione 2021/914) e di misure
        supplementari di carattere tecnico (cifratura in transito e a riposo) e organizzativo.
      </p>

      <h2>7. Diritti dell&apos;interessato</h2>
      <p>
        L&apos;interessato pu&ograve; esercitare in qualsiasi momento i diritti previsti dagli
        artt. 15–22 GDPR:
      </p>
      <ul>
        <li>accesso ai propri dati personali e copia degli stessi;</li>
        <li>rettifica dei dati inesatti o incompleti;</li>
        <li>cancellazione (&laquo;diritto all&apos;oblio&raquo;);</li>
        <li>limitazione del trattamento;</li>
        <li>portabilit&agrave; in formato strutturato e leggibile da macchina;</li>
        <li>opposizione al trattamento basato sul legittimo interesse;</li>
        <li>revoca del consenso prestato per i cookie di analisi.</li>
      </ul>
      <p>
        Le richieste vanno inviate a{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>. Lume
        risponde entro <strong>1 mese</strong> dalla ricezione (art. 12.3 GDPR), prorogabile di
        ulteriori 2 mesi per richieste particolarmente complesse, con motivata comunicazione
        all&apos;interessato. Lume mette inoltre a disposizione strumenti self-service di
        esportazione e cancellazione dei dati direttamente nell&apos;area di gestione
        dell&apos;account.
      </p>

      <h2>8. Reclamo all&apos;autorit&agrave; di controllo</h2>
      <p>
        L&apos;autorit&agrave; di controllo capofila per Lume &egrave;{' '}
        <strong>{LUME_LEGAL.leadSupervisoryAuthority.fullName}</strong> (
        <a
          href={LUME_LEGAL.leadSupervisoryAuthority.url}
          target="_blank"
          rel="noreferrer"
        >
          {LUME_LEGAL.leadSupervisoryAuthority.url.replace('https://', '')}
        </a>
        ). Gli interessati residenti in Italia possono comunque presentare reclamo al{' '}
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer">
          Garante per la protezione dei dati personali
        </a>
        , che agir&agrave; in cooperazione con Datatilsynet ai sensi degli artt. 56 e 60–66 GDPR.
      </p>

      <h2>9. Decisioni automatizzate</h2>
      <p>
        Lume non effettua decisioni interamente automatizzate, n&eacute; profilazione, che
        producano effetti giuridici sull&apos;interessato (art. 22 GDPR).
      </p>

      <h2>10. Sicurezza</h2>
      <p>
        I dati sono protetti con misure tecniche e organizzative appropriate ai sensi
        dell&apos;art. 32 GDPR: cifratura in transito (TLS) e a riposo, controlli di accesso
        basati su ruoli, autenticazione multi-fattore per gli amministratori, isolamento
        multi-tenant a livello di database (Row-Level Security), backup cifrati e log di accesso.
      </p>

      <h2>11. Notifica violazioni</h2>
      <p>
        In caso di violazione dei dati personali (data breach) ai sensi dell&apos;art. 33 GDPR,
        Lume notifica il Cliente entro <strong>24 ore</strong> dalla scoperta, in modo da
        consentire al Cliente di adempiere al proprio obbligo di notifica all&apos;autorit&agrave;
        di controllo entro 72 ore.
      </p>

      <h2>12. Modifiche</h2>
      <p>
        Lume pu&ograve; aggiornare questa informativa per riflettere modifiche normative o del
        Servizio. Le modifiche sostanziali sono comunicate via email e con avviso in app con
        almeno 30 giorni di preavviso; la versione vigente &egrave; sempre consultabile su questa
        pagina.
      </p>

      <h2>13. Contatti</h2>
      <p>
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>
      </p>
    </>
  );
}
