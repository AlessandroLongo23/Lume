// Consenso a comunicazioni di marketing diretto, granulare per canale.
// Art. 130 Codice Privacy + art. 6.1.a GDPR.
export function ConsensoMarketing() {
  return (
    <>
      <p>
        Il sottoscritto cliente, presa visione dell&apos;informativa privacy del salone,
        esprime il proprio consenso al ricevimento di comunicazioni di marketing diretto
        (promozioni, novit&agrave;, eventi, offerte personalizzate) <strong>per ciascun canale
        spuntato</strong>. Ogni canale richiede consenso indipendente ai sensi dell&apos;art. 130
        del Codice Privacy.
      </p>

      <h2>Canali</h2>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Email</strong> &mdash; promozioni, newsletter, novit&agrave; del salone.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>SMS</strong> &mdash; offerte rapide, promemoria di campagne stagionali.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>WhatsApp</strong> &mdash; messaggi promozionali sul numero indicato.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Telefono</strong> &mdash; chiamate per inviti a eventi e offerte personali.
        </span>
      </div>

      <h2>Modalit&agrave; e revoca</h2>
      <ul>
        <li>I dati di contatto (email, numero di telefono) sono utilizzati esclusivamente
          dal salone e dai suoi responsabili tecnici (gestionale Lume, eventuale provider di
          invio email/SMS).</li>
        <li>Pu&ograve; <strong>revocare il consenso in qualsiasi momento</strong> per uno o
          pi&ugrave; canali, inviando una richiesta scritta al salone, cliccando sul link
          &laquo;Disiscriviti&raquo; presente in ogni email, oppure rispondendo
          &laquo;STOP&raquo; agli SMS/WhatsApp.</li>
        <li>La revoca non pregiudica la liceit&agrave; delle comunicazioni inviate prima della
          revoca.</li>
        <li>Il consenso &egrave; conservato fino a revoca o, in mancanza, per 24 mesi
          dall&apos;ultimo contatto utile.</li>
      </ul>

      <p style={{ marginTop: 16 }}>
        <strong>Mancato consenso</strong>: il rifiuto al marketing non comporta alcuna
        conseguenza sulla qualit&agrave; o sull&apos;erogazione dei servizi.
      </p>

      <div className="document-signature">
        <div className="document-signature-block">
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Luogo e data</p>
          </div>
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Nome e cognome (in stampatello)</p>
          </div>
        </div>
        <div className="document-signature-block">
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Firma del cliente</p>
          </div>
        </div>
      </div>
    </>
  );
}
