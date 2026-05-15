// Autorizzazione del genitore/tutore per cliente minorenne.
// Art. 8 GDPR + Art. 2-quinquies Codice Privacy (in Italia consenso valido
// dai 14 anni; sotto, serve il genitore).
export function ConsensoMinore() {
  return (
    <>
      <p>
        Il/la sottoscritto/a, in qualit&agrave; di esercente la responsabilit&agrave; genitoriale
        sul minore di seguito identificato, autorizza il salone al trattamento dei dati personali
        del minore ai sensi dell&apos;art. 8 GDPR e dell&apos;art. 2-quinquies del Codice Privacy.
      </p>

      <h2>Dati del minore</h2>
      <table>
        <tbody>
          <tr>
            <th>Nome e cognome</th>
            <td style={{ height: 24 }}></td>
          </tr>
          <tr>
            <th>Data di nascita</th>
            <td style={{ height: 24 }}></td>
          </tr>
          <tr>
            <th>Codice fiscale</th>
            <td style={{ height: 24 }}></td>
          </tr>
        </tbody>
      </table>

      <h2>Dati del genitore / tutore</h2>
      <table>
        <tbody>
          <tr>
            <th>Nome e cognome</th>
            <td style={{ height: 24 }}></td>
          </tr>
          <tr>
            <th>Codice fiscale</th>
            <td style={{ height: 24 }}></td>
          </tr>
          <tr>
            <th>Documento di identità (tipo e numero)</th>
            <td style={{ height: 24 }}></td>
          </tr>
          <tr>
            <th>Telefono / email</th>
            <td style={{ height: 24 }}></td>
          </tr>
        </tbody>
      </table>

      <h2>Autorizzazioni</h2>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Autorizzo</strong> il trattamento dei dati anagrafici e operativi del minore
          per la prenotazione e l&apos;erogazione dei servizi presso il salone.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Autorizzo</strong> il salone ad annotare eventuali allergie e condizioni
          cutanee del minore, ai sensi dell&apos;art. 9.2.a GDPR.
        </span>
      </div>
      <div className="document-checkbox-row">
        <span className="document-checkbox" aria-hidden />
        <span>
          <strong>Autorizzo</strong> l&apos;utilizzo di fotografie del minore secondo le
          modalit&agrave; specificate nel modulo &laquo;Consenso fotografie&raquo;, da firmarsi
          separatamente.
        </span>
      </div>

      <h2>Dichiarazioni</h2>
      <ul>
        <li>Dichiaro di esercitare la responsabilit&agrave; genitoriale sul minore sopra
          identificato e di aver ricevuto e compreso l&apos;informativa privacy del salone.</li>
        <li>Mi impegno a comunicare tempestivamente al salone ogni variazione rilevante (es.
          nuove allergie, terapie in corso) per la sicurezza del trattamento.</li>
        <li>Posso revocare l&apos;autorizzazione in qualsiasi momento contattando il salone; la
          revoca non pregiudica la liceit&agrave; dei trattamenti precedenti.</li>
      </ul>

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
            <p className="document-signature-label">
              Firma del genitore / tutore esercente la responsabilità genitoriale
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
