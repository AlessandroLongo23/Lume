// Consenso esplicito per il trattamento di dati particolari (art. 9 GDPR).
// Indispensabile per annotare allergie, condizioni cutanee, gravidanza, terapie.
export function ConsensoDatiParticolari() {
  return (
    <>
      <p>
        Letto e compreso il contenuto dell&apos;informativa privacy del salone (Art. 13 GDPR), il
        sottoscritto cliente <strong>presta liberamente, specificamente e in modo informato</strong>{' '}
        il proprio consenso esplicito ai sensi dell&apos;art. 9.2.a del Regolamento (UE) 2016/679
        al trattamento dei seguenti <strong>dati particolari</strong>:
      </p>

      <h2>Dati per i quali si presta consenso</h2>
      <p>
        Spunta solo le categorie pertinenti. Per ciascuna spunta &egrave; richiesto consenso
        espresso e indipendente.
      </p>

      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Allergie e intolleranze cutanee</strong> &mdash; necessarie per scegliere
          prodotti compatibili e prevenire reazioni avverse.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Condizioni del cuoio capelluto / della cute</strong> (psoriasi, dermatiti,
          alopecia, cicatrici, sensibilit&agrave; particolari) &mdash; per personalizzare i
          trattamenti tecnici.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Stato di gravidanza o allattamento</strong> &mdash; per evitare prodotti o
          tecniche controindicate.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Terapie farmacologiche in corso</strong> (in particolare terapie oncologiche
          o ormonali) potenzialmente rilevanti per le tecniche di colorazione e trattamento.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Altre informazioni sanitarie pertinenti</strong> indicate dal cliente al
          professionista.
        </span>
      </div>

      <h2>Finalit&agrave;</h2>
      <p>
        I dati sopra indicati sono trattati esclusivamente per le seguenti finalit&agrave;:
      </p>
      <ul>
        <li>scelta dei prodotti e delle tecniche pi&ugrave; appropriate alle Sue
          caratteristiche individuali;</li>
        <li>prevenzione di reazioni allergiche o di trattamenti controindicati;</li>
        <li>consulenza tecnica personalizzata da parte del professionista.</li>
      </ul>

      <h2>Conservazione e revoca</h2>
      <p>
        I dati particolari sono conservati per la durata del rapporto e fino a 10 anni successivi
        per finalit&agrave; di documentazione tecnica. Pu&ograve; <strong>revocare il consenso
        in qualsiasi momento</strong>, comunicandolo al salone: la revoca non pregiudica la
        liceit&agrave; del trattamento basata sul consenso prima della revoca.
      </p>

      <p style={{ marginTop: 16 }}>
        <strong>Mancato consenso</strong>: in assenza del Suo consenso il salone non potr&agrave;
        registrare alcuna informazione sanitaria; il professionista La invita comunque a
        comunicare verbalmente eventuali allergie o condizioni rilevanti per la sicurezza
        del trattamento.
      </p>

      <div className="document-signature">
        <div className="document-signature-block">
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Luogo e data</p>
          </div>
          <div>
            <div className="document-signature-line" />
            <p className="document-signature-label">Nome e cognome del cliente (in stampatello)</p>
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
