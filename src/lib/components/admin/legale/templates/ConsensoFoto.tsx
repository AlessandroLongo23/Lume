// Consenso al trattamento di immagini fotografiche pre/post trattamento.
// Combina art. 9 GDPR (foto = dato biometrico/sanitario in alcuni contesti)
// con artt. 96-97 L. 633/1941 sul diritto all'immagine.
export function ConsensoFoto() {
  return (
    <>
      <p>
        Il sottoscritto cliente, letta l&apos;informativa privacy del salone, si esprime
        liberamente sull&apos;utilizzo di proprie fotografie da parte del Titolare ai sensi
        dell&apos;art. 9 GDPR e degli artt. 96 e 97 della Legge 633/1941 (diritto
        all&apos;immagine), apponendo una crocetta accanto alle opzioni di proprio interesse.
      </p>

      <h2>Opzione A &mdash; Uso interno (cartella tecnica)</h2>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Acconsento</strong> alla realizzazione e conservazione di fotografie pre/post
          trattamento <strong>solo all&apos;interno della mia cartella tecnica</strong> presso il
          salone, accessibili esclusivamente al professionista che mi segue, per finalit&agrave;
          di documentazione tecnica e di personalizzazione dei trattamenti successivi.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>NON acconsento</strong> all&apos;uso interno.
        </span>
      </div>

      <h2>Opzione B &mdash; Uso promozionale (social, sito, materiale pubblicitario)</h2>
      <p>
        Questo consenso &egrave; <strong>indipendente</strong> dal precedente: pu&ograve; dare
        l&apos;uno e negare l&apos;altro.
      </p>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Acconsento</strong> alla pubblicazione delle mie fotografie pre/post
          trattamento sui canali di comunicazione del salone (sito web, profili Instagram,
          Facebook, TikTok, brochure cartacee), <strong>senza che mi siano riconosciuti
          compensi</strong>, ai sensi dell&apos;art. 97 L. 633/1941.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>NON acconsento</strong> all&apos;uso promozionale.
        </span>
      </div>

      <h3>Modalit&agrave; del consenso promozionale</h3>
      <ul>
        <li>Le immagini possono essere pubblicate <strong>solo</strong> nelle modalit&agrave;
          spuntate sopra: il salone non potr&agrave; cederle a terzi diversi dai propri
          fornitori di servizi tecnici (es. agenzia social, stampatore).</li>
        <li>Pu&ograve; richiedere in qualsiasi momento la <strong>rimozione</strong> delle
          immagini gi&agrave; pubblicate, scrivendo o telefonando al salone. Il salone si
          impegna a rimuoverle entro 7 giorni lavorativi dai propri canali e a richiederne
          la rimozione ai fornitori coinvolti.</li>
        <li>Il consenso &egrave; revocabile in qualsiasi momento; la revoca non pregiudica la
          liceit&agrave; delle pubblicazioni precedenti.</li>
      </ul>

      <p style={{ marginTop: 16 }}>
        <strong>Mancato consenso</strong>: l&apos;assenza dei consensi qui sopra non incide in
        alcun modo sulla qualit&agrave; del servizio fornito.
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
