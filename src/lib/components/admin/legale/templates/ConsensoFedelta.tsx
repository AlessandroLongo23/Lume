// Consenso al programma fedeltà / profilazione automatizzata.
// Necessario quando il salone usa scoring, sconti su base storico,
// raccomandazioni automatiche.
export function ConsensoFedelta() {
  return (
    <>
      <p>
        Il sottoscritto cliente, presa visione dell&apos;informativa privacy del salone, esprime
        il proprio consenso esplicito alle seguenti attivit&agrave; di profilazione e gestione
        del programma fedelt&agrave;.
      </p>

      <h2>Profilazione e programma fedelt&agrave;</h2>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Acconsento</strong> all&apos;analisi delle mie abitudini di acquisto (servizi
          frequenti, frequenza di visita, preferenze tecniche, fascia di spesa) per finalit&agrave;
          di:
          <ul>
            <li>assegnazione di sconti, premi o offerte personalizzate;</li>
            <li>invio di promozioni mirate sui canali per cui ho prestato consenso;</li>
            <li>partecipazione al programma fedelt&agrave; del salone (raccolta punti,
              tessera/benefit, premi).</li>
          </ul>
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>NON acconsento</strong>: i miei dati saranno usati solo per la gestione
          dell&apos;appuntamento e degli adempimenti fiscali, senza profilazione.
        </span>
      </div>

      <h2>Modalit&agrave;</h2>
      <ul>
        <li>L&apos;analisi avviene <strong>internamente al gestionale Lume</strong> ed &egrave;
          consultabile esclusivamente dal personale del salone.</li>
        <li><strong>Nessuna decisione esclusivamente automatizzata</strong> (art. 22 GDPR) viene
          presa nei Suoi confronti: ogni offerta o sconto &egrave; sempre validato dal
          personale del salone prima di esserLe comunicato.</li>
        <li>Conservazione dei dati di profilazione: per la durata del rapporto e fino a 24 mesi
          dopo l&apos;ultimo contatto utile, salvo revoca.</li>
        <li>Pu&ograve; revocare il consenso in qualsiasi momento; la revoca comporta
          l&apos;uscita dal programma fedelt&agrave;, senza penalit&agrave;.</li>
      </ul>

      <p style={{ marginTop: 16 }}>
        <strong>Mancato consenso</strong>: nessuna conseguenza sulla qualit&agrave; del servizio;
        non potr&agrave; per&ograve; partecipare al programma fedelt&agrave; n&eacute; ricevere
        offerte personalizzate.
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
