import type { Metadata } from 'next';
import Link from 'next/link';
import { LUME_LEGAL, formatLumeAddress, formatLumeIdentity } from '@/lib/const/legal';
import { LEGAL_VERSIONS } from '@/lib/const/legalVersions';

export const metadata: Metadata = {
  title: 'Data Processing Agreement — Lume',
  description: 'Accordo sul trattamento dei dati ai sensi dell’art. 28 GDPR.',
};

export default function DpaPage() {
  return (
    <>
      <h1>Data Processing Agreement (DPA)</h1>
      <p>
        <em>Versione {LEGAL_VERSIONS.dpa} &mdash; ai sensi dell&apos;art. 28 GDPR.</em>
      </p>
      <p>
        Il presente accordo (&laquo;<strong>DPA</strong>&raquo;) regola il trattamento dei dati
        personali che <strong>{formatLumeIdentity()}</strong>
        {LUME_LEGAL.address.country
          ? `, con sede in ${formatLumeAddress() || LUME_LEGAL.address.country}`
          : ''}{' '}
        (&laquo;<strong>Lume</strong>&raquo; o &laquo;<strong>Responsabile</strong>&raquo;)
        effettua per conto del Cliente (&laquo;<strong>Titolare</strong>&raquo;) nell&apos;ambito
        dell&apos;erogazione del servizio Lume (&laquo;<strong>Servizio</strong>&raquo;), come
        regolato dai{' '}
        <Link href="/terms">Termini di servizio</Link> e dall&apos;
        <Link href="/privacy">Informativa sulla privacy</Link>.
      </p>
      <p>
        Il presente DPA &egrave; concluso fra le Parti mediante accettazione contestuale alla
        registrazione al Servizio (Art. 28.9 GDPR &mdash; forma elettronica) ed &egrave; parte
        integrante del contratto di abbonamento.
      </p>

      <h2>1. Definizioni</h2>
      <p>
        I termini &laquo;dato personale&raquo;, &laquo;trattamento&raquo;, &laquo;Titolare&raquo;,
        &laquo;Responsabile&raquo;, &laquo;sub-responsabile&raquo;, &laquo;interessato&raquo; e
        &laquo;violazione dei dati personali&raquo; hanno il significato loro attribuito dal
        Regolamento (UE) 2016/679 (&laquo;GDPR&raquo;).
      </p>

      <h2>2. Oggetto e durata</h2>
      <ul>
        <li>
          <strong>Oggetto</strong>: trattamento dei dati personali necessario all&apos;erogazione
          del Servizio (gestione anagrafiche clienti del salone, appuntamenti, fiches, ordini,
          fatturazione, comunicazioni).
        </li>
        <li>
          <strong>Durata</strong>: per tutta la durata del contratto di abbonamento, oltre al
          periodo necessario per il rilascio dei dati e l&apos;eventuale conservazione per
          obblighi di legge.
        </li>
        <li>
          <strong>Natura del trattamento</strong>: archiviazione, organizzazione, consultazione,
          modifica, comunicazione (verso sub-responsabili), cancellazione.
        </li>
        <li>
          <strong>Finalit&agrave;</strong>: fornitura del Servizio secondo le istruzioni del
          Titolare.
        </li>
      </ul>

      <h2>3. Categorie di interessati e dati</h2>
      <ul>
        <li>
          <strong>Interessati</strong>: clienti del salone, operatori e collaboratori del salone,
          fornitori del salone.
        </li>
        <li>
          <strong>Categorie di dati comuni</strong>: dati anagrafici, di contatto, fiscali,
          appuntamenti, storico servizi/prodotti, dati contabili.
        </li>
        <li>
          <strong>Categorie particolari</strong> (art. 9 GDPR), quando inseriti dal Titolare:
          informazioni su allergie, condizioni cutanee/cuoio capelluto, gravidanza, terapie in
          corso, fotografie pre/post trattamento. Il Titolare &egrave; responsabile di acquisire
          il consenso esplicito ai sensi dell&apos;art. 9.2.a GDPR (modulistica disponibile nella
          sezione <Link href="/admin/impostazioni/legale/deliberatorie">Deliberatorie</Link>).
        </li>
      </ul>

      <h2>4. Istruzioni documentate del Titolare</h2>
      <p>
        Lume tratta i dati personali esclusivamente sulla base delle istruzioni documentate del
        Titolare, costituite dal presente DPA, dai Termini di servizio, dall&apos;Informativa
        privacy e dalle configurazioni operate dal Titolare nel pannello del Servizio
        (impostazioni di marketing, periodi di retention personalizzati, abilitazione di
        funzionalit&agrave; opzionali). Eventuali ulteriori istruzioni devono essere fornite per
        iscritto.
      </p>
      <p>
        Lume informa immediatamente il Titolare se ritiene che un&apos;istruzione violi il GDPR o
        altre disposizioni applicabili in materia di protezione dei dati.
      </p>

      <h2>5. Riservatezza</h2>
      <p>
        Lume garantisce che le persone autorizzate al trattamento si sono impegnate alla
        riservatezza o sono soggette a un adeguato obbligo legale di segretezza, e ricevono
        formazione periodica sulla protezione dei dati.
      </p>

      <h2>6. Misure di sicurezza (art. 32 GDPR)</h2>
      <p>Lume adotta le seguenti misure tecniche e organizzative:</p>
      <ul>
        <li>cifratura in transito (TLS 1.2+) e a riposo (AES-256);</li>
        <li>controlli di accesso basati su ruoli (RBAC) e isolamento multi-tenant tramite
          Row-Level Security a livello di database;</li>
        <li>autenticazione multi-fattore obbligatoria per gli amministratori di Lume;</li>
        <li>logging delle azioni amministrative e degli accessi privilegiati;</li>
        <li>backup cifrati con rotazione a 30 giorni;</li>
        <li>processi di patch management e gestione delle vulnerabilit&agrave;;</li>
        <li>continuit&agrave; operativa e disaster recovery tramite hosting geo-distribuito.</li>
      </ul>

      <h2>7. Sub-responsabili (sub-processors)</h2>
      <p>
        Il Titolare autorizza in via generale Lume ad avvalersi dei sub-responsabili elencati
        alla pagina <Link href="/sub-processors">Sub-processors</Link>. Lume comunica al Titolare
        eventuali modifiche dell&apos;elenco con preavviso di almeno <strong>30 giorni</strong>.
        Il Titolare pu&ograve; opporsi per motivi giustificati entro 15 giorni dalla
        comunicazione, mediante notifica scritta a{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>; in tal caso
        Lume potr&agrave; risolvere il contratto qualora l&apos;impiego del sub-responsabile sia
        necessario all&apos;erogazione del Servizio.
      </p>
      <p>
        Lume stipula con ciascun sub-responsabile contratti che impongono obblighi di
        protezione dei dati equivalenti a quelli del presente DPA.
      </p>

      <h2>8. Diritti degli interessati (artt. 12&ndash;22 GDPR)</h2>
      <p>
        Lume mette a disposizione del Titolare strumenti tecnici per dar seguito alle richieste
        degli interessati: esportazione dei dati in formato strutturato (
        <Link href="/admin/impostazioni/account/dati">Esporta dati</Link>), cancellazione
        selettiva o totale, rettifica direttamente dall&apos;interfaccia. Per richieste che
        eccedano queste funzioni il Titolare pu&ograve; rivolgersi a{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>; Lume
        risponde entro 5 giorni lavorativi.
      </p>

      <h2>9. Notifica delle violazioni (art. 33 GDPR)</h2>
      <p>
        In caso di violazione dei dati personali, Lume notifica il Titolare{' '}
        <strong>senza ingiustificato ritardo e comunque entro 24 ore</strong> dalla scoperta,
        fornendo: natura della violazione, categorie e numero approssimativo di interessati e
        record coinvolti, conseguenze probabili, misure adottate o proposte. La notifica viene
        inviata all&apos;email del titolare/owner del salone registrata nel Servizio. La notifica
        all&apos;autorit&agrave; di controllo entro 72 ore (art. 33 GDPR) e l&apos;eventuale
        comunicazione agli interessati (art. 34 GDPR) restano in capo al Titolare.
      </p>

      <h2>10. Assistenza per DPIA (art. 35 GDPR) e consultazione preventiva (art. 36 GDPR)</h2>
      <p>
        Su richiesta scritta, Lume fornisce al Titolare le informazioni necessarie per la
        valutazione d&apos;impatto sulla protezione dei dati e per l&apos;eventuale consultazione
        preventiva dell&apos;autorit&agrave; di controllo, tenendo conto della natura del
        trattamento e delle informazioni disponibili.
      </p>

      <h2>11. Restituzione e cancellazione al termine</h2>
      <p>
        Alla cessazione del contratto, il Titolare pu&ograve; esportare integralmente i propri
        dati per <strong>30 giorni</strong> tramite la funzione di esportazione del Servizio.
        Decorsi i 30 giorni, Lume cancella o anonimizza i dati operativi del salone. Restano
        conservate, per i tempi previsti dalla normativa applicabile, le informazioni necessarie
        ad adempimenti legali e contabili (art. 2220 c.c.: 10 anni per la documentazione
        contabile).
      </p>
      <p>
        I dati presenti nei backup di sicurezza sono cancellati al successivo ciclo di rotazione
        (entro 30 giorni).
      </p>

      <h2>12. Audit (art. 28.3.h GDPR)</h2>
      <p>
        Lume mette a disposizione del Titolare, su richiesta scritta non pi&ugrave; di una volta
        l&apos;anno, tutte le informazioni necessarie a dimostrare il rispetto degli obblighi del
        presente DPA, inclusi report di conformit&agrave; e certificazioni di sub-responsabili.
        Audit on-site sono ammessi a spese del Titolare, con preavviso di 30 giorni e
        sottoscrizione di accordo di riservatezza, al di fuori dei periodi di
        manutenzione/incident in corso.
      </p>

      <h2>13. Trasferimenti extra-UE</h2>
      <p>
        Eventuali trasferimenti di dati verso Paesi terzi avvengono sulla base delle{' '}
        <em>Clausole Contrattuali Standard</em> approvate dalla Commissione Europea (decisione
        di esecuzione 2021/914) e di misure supplementari tecniche e organizzative adeguate, come
        descritto nell&apos;<Link href="/privacy">Informativa sulla privacy</Link>.
      </p>

      <h2>14. Responsabilit&agrave; e legge applicabile</h2>
      <p>
        Le responsabilit&agrave; e le limitazioni della medesima sono regolate dai Termini di
        servizio. Il presente DPA &egrave; soggetto alla legge applicabile ai Termini di
        servizio, fatta salva l&apos;applicazione delle norme imperative di tutela del Titolare
        eventualmente applicabili in base al diritto dello Stato di sua residenza.
      </p>

      <h2>15. Modifiche</h2>
      <p>
        Lume pu&ograve; aggiornare il DPA per riflettere modifiche normative o operative;
        modifiche sostanziali vengono comunicate al Titolare con almeno 30 giorni di preavviso e
        richiedono nuova accettazione al successivo accesso al Servizio. Le versioni precedenti
        rimangono consultabili nella sezione legale del Titolare.
      </p>

      <h2>16. Contatti</h2>
      <p>
        Per qualsiasi questione relativa al presente DPA:{' '}
        <a href={`mailto:${LUME_LEGAL.privacyEmail}`}>{LUME_LEGAL.privacyEmail}</a>.
      </p>
    </>
  );
}
