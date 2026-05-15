// Modulo Art. 13 GDPR — informativa al cliente del salone.
// Titolare = il salone; Lume figura come Responsabile (art. 28 GDPR).
export function InformativaCliente() {
  return (
    <>
      <p>
        Ai sensi dell&apos;art. 13 del Regolamento (UE) 2016/679 (&laquo;<strong>GDPR</strong>
        &raquo;) e del D.lgs. 196/2003 (&laquo;Codice Privacy&raquo;), il titolare del
        trattamento sopra indicato (&laquo;Titolare&raquo;) La informa che i Suoi dati personali
        verranno trattati nelle modalit&agrave; e per le finalit&agrave; di seguito descritte.
      </p>

      <h2>1. Categorie di dati trattati</h2>
      <ul>
        <li>
          <strong>Dati anagrafici e di contatto</strong>: nome, cognome, data di nascita, indirizzo,
          telefono, email.
        </li>
        <li>
          <strong>Dati relativi ai servizi</strong>: storico appuntamenti, servizi/prodotti
          ricevuti, preferenze tecniche, importi pagati.
        </li>
        <li>
          <strong>Dati particolari</strong> (art. 9 GDPR), solo previo Suo consenso esplicito:
          allergie, condizioni cutanee/cuoio capelluto, gravidanza, terapie in corso.
        </li>
        <li>
          <strong>Immagini fotografiche</strong> (es. pre/post trattamento), solo previo Suo
          consenso espresso e con modalit&agrave; specificate nel relativo modulo.
        </li>
      </ul>

      <h2>2. Finalit&agrave; e basi giuridiche</h2>
      <ul>
        <li>
          <strong>Erogazione dei servizi</strong> di acconciatura/estetica e gestione del rapporto
          contrattuale &mdash; base: esecuzione del contratto (art. 6.1.b GDPR).
        </li>
        <li>
          <strong>Adempimenti fiscali e contabili</strong> &mdash; base: obbligo di legge
          (art. 6.1.c GDPR).
        </li>
        <li>
          <strong>Comunicazioni di servizio</strong> (es. promemoria appuntamento) &mdash; base:
          esecuzione del contratto (art. 6.1.b GDPR).
        </li>
        <li>
          <strong>Annotazione di dati sanitari</strong> rilevanti per il trattamento (allergie,
          condizioni cutanee) &mdash; base: consenso esplicito (art. 9.2.a GDPR).
        </li>
        <li>
          <strong>Comunicazioni di marketing diretto</strong> (promozioni, novit&agrave;, eventi)
          &mdash; base: consenso (art. 6.1.a GDPR + art. 130 Codice Privacy).
        </li>
      </ul>

      <h2>3. Modalit&agrave; del trattamento</h2>
      <p>
        I dati sono trattati con strumenti informatici (gestionale Lume) e cartacei, da personale
        autorizzato e formato, con misure tecniche e organizzative adeguate ai sensi dell&apos;art.
        32 GDPR.
      </p>

      <h2>4. Conservazione</h2>
      <ul>
        <li>Dati anagrafici e operativi: per la durata del rapporto e fino a 10 anni successivi
          (art. 2220 c.c.).</li>
        <li>Dati per finalit&agrave; di marketing: fino a revoca del consenso o, in mancanza, 24
          mesi dall&apos;ultimo contatto.</li>
        <li>Fotografie: fino a revoca del consenso o cancellazione richiesta.</li>
      </ul>

      <h2>5. Comunicazione e responsabili esterni</h2>
      <p>
        I dati possono essere comunicati a:
      </p>
      <ul>
        <li>
          <strong>Lume</strong> &mdash; gestionale software, in qualit&agrave; di responsabile del
          trattamento ex art. 28 GDPR;
        </li>
        <li>commercialista, professionisti incaricati di adempimenti contabili/fiscali;</li>
        <li>autorit&agrave; pubbliche, quando previsto dalla legge.</li>
      </ul>

      <h2>6. I Suoi diritti (artt. 15&ndash;22 GDPR)</h2>
      <p>
        In qualsiasi momento ha diritto di chiedere al Titolare l&apos;accesso ai propri dati,
        la rettifica, la cancellazione, la limitazione o l&apos;opposizione al trattamento, la
        portabilit&agrave;, nonch&eacute; di revocare i consensi prestati. Pu&ograve; presentare
        reclamo al Garante per la protezione dei dati personali (
        <span>www.garanteprivacy.it</span>).
      </p>

      <p style={{ marginTop: 24 }}>
        Per esercitare i Suoi diritti contatti il salone ai recapiti indicati in alto.
      </p>

      <div className="document-signature">
        <div className="document-signature-block">
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Luogo e data</p>
          </div>
        </div>
        <div className="document-signature-block">
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Firma del cliente per presa visione</p>
          </div>
        </div>
      </div>
    </>
  );
}
