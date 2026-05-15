// Registro dei Trattamenti del salone — Art. 30 GDPR.
// Auto-generato in base alla configurazione del salone (Lume legge sempre i
// trattamenti standard; se in futuro sarà esposto un flag "marketing attivo"
// le sezioni opzionali andranno gated).
export function RegistroTrattamenti() {
  return (
    <>
      <p>
        Il presente Registro &egrave; redatto ai sensi dell&apos;art. 30 del Regolamento (UE)
        2016/679 (&laquo;GDPR&raquo;), che ne impone la tenuta a tutti i titolari del trattamento
        che effettuano trattamenti di dati particolari (art. 9 GDPR), come tipicamente avviene
        nei saloni di acconciatura/estetica per la gestione di allergie, condizioni cutanee e
        fotografie.
      </p>
      <p>
        Il Titolare lo aggiorna ad ogni cambiamento sostanziale e lo conserva in formato cartaceo
        o elettronico, per renderlo disponibile su richiesta dell&apos;autorit&agrave; di
        controllo.
      </p>

      <h2>1. Trattamento &mdash; Anagrafica clienti e prenotazione appuntamenti</h2>
      <table>
        <tbody>
          <tr><th>Finalit&agrave;</th><td>Erogazione del servizio, prenotazione appuntamenti, comunicazioni di servizio</td></tr>
          <tr><th>Base giuridica</th><td>Esecuzione del contratto (art. 6.1.b GDPR)</td></tr>
          <tr><th>Categorie di interessati</th><td>Clienti del salone</td></tr>
          <tr><th>Categorie di dati</th><td>Anagrafici, contatto, storico appuntamenti</td></tr>
          <tr><th>Destinatari</th><td>Lume (Responsabile ex art. 28 GDPR), commercialista</td></tr>
          <tr><th>Trasferimenti extra-UE</th><td>Hosting via fornitori USA con Clausole Contrattuali Standard 2021/914</td></tr>
          <tr><th>Conservazione</th><td>Durata del rapporto + 10 anni (art. 2220 c.c.)</td></tr>
          <tr><th>Misure di sicurezza</th><td>RBAC sul gestionale, MFA per gli amministratori, cifratura at-rest e in-transit, backup</td></tr>
        </tbody>
      </table>

      <h2>2. Trattamento &mdash; Dati particolari (allergie, condizioni cutanee, gravidanza)</h2>
      <table>
        <tbody>
          <tr><th>Finalit&agrave;</th><td>Personalizzazione tecnica, prevenzione di reazioni avverse</td></tr>
          <tr><th>Base giuridica</th><td>Consenso esplicito (art. 9.2.a GDPR)</td></tr>
          <tr><th>Categorie di interessati</th><td>Clienti del salone</td></tr>
          <tr><th>Categorie di dati</th><td>Allergie, condizioni cutanee/cuoio capelluto, gravidanza, terapie in corso</td></tr>
          <tr><th>Destinatari</th><td>Personale tecnico autorizzato del salone, Lume (Responsabile)</td></tr>
          <tr><th>Trasferimenti extra-UE</th><td>Vedi punto 1</td></tr>
          <tr><th>Conservazione</th><td>Durata del rapporto + 10 anni; cancellazione su revoca del consenso</td></tr>
          <tr><th>Misure di sicurezza</th><td>Accesso limitato al solo personale tecnico; campi cifrati lato applicazione</td></tr>
        </tbody>
      </table>

      <h2>3. Trattamento &mdash; Fotografie pre/post trattamento</h2>
      <table>
        <tbody>
          <tr><th>Finalit&agrave;</th><td>Documentazione tecnica interna; uso promozionale (se autorizzato)</td></tr>
          <tr><th>Base giuridica</th><td>Consenso (art. 6.1.a GDPR + artt. 96-97 L. 633/1941)</td></tr>
          <tr><th>Categorie di interessati</th><td>Clienti del salone</td></tr>
          <tr><th>Categorie di dati</th><td>Immagini fotografiche (talora dati biometrici)</td></tr>
          <tr><th>Destinatari</th><td>Salone; agenzia social/stampatore se autorizzato per uso promozionale</td></tr>
          <tr><th>Trasferimenti extra-UE</th><td>Vedi punto 1; piattaforme social trattano dati ai propri termini</td></tr>
          <tr><th>Conservazione</th><td>Fino a revoca del consenso; rimozione dai canali entro 7 giorni dalla richiesta</td></tr>
          <tr><th>Misure di sicurezza</th><td>Storage privato in Lume con accesso solo al personale autorizzato</td></tr>
        </tbody>
      </table>

      <h2>4. Trattamento &mdash; Marketing diretto</h2>
      <table>
        <tbody>
          <tr><th>Finalit&agrave;</th><td>Promozioni, newsletter, eventi, offerte personalizzate</td></tr>
          <tr><th>Base giuridica</th><td>Consenso per canale (art. 130 Codice Privacy)</td></tr>
          <tr><th>Categorie di interessati</th><td>Clienti che hanno prestato consenso</td></tr>
          <tr><th>Categorie di dati</th><td>Email, telefono, WhatsApp, storico interessi</td></tr>
          <tr><th>Destinatari</th><td>Provider di invio email/SMS (Resend, eventuali integratori)</td></tr>
          <tr><th>Trasferimenti extra-UE</th><td>Provider USA con Clausole Contrattuali Standard</td></tr>
          <tr><th>Conservazione</th><td>Fino a revoca; in mancanza, 24 mesi dall&apos;ultimo contatto</td></tr>
          <tr><th>Misure di sicurezza</th><td>Disiscrizione one-click; log delle revoche; rate limiting</td></tr>
        </tbody>
      </table>

      <h2>5. Trattamento &mdash; Adempimenti fiscali e contabili</h2>
      <table>
        <tbody>
          <tr><th>Finalit&agrave;</th><td>Fatturazione, registri IVA, dichiarazioni fiscali</td></tr>
          <tr><th>Base giuridica</th><td>Obbligo di legge (art. 6.1.c GDPR)</td></tr>
          <tr><th>Categorie di interessati</th><td>Clienti, fornitori</td></tr>
          <tr><th>Categorie di dati</th><td>Anagrafici, fiscali (P. IVA, codice fiscale), importi</td></tr>
          <tr><th>Destinatari</th><td>Commercialista, Sistema di Interscambio (SDI), Agenzia delle Entrate</td></tr>
          <tr><th>Trasferimenti extra-UE</th><td>Nessuno per i dati fiscali</td></tr>
          <tr><th>Conservazione</th><td>10 anni (art. 2220 c.c.; art. 22 D.P.R. 600/1973)</td></tr>
          <tr><th>Misure di sicurezza</th><td>Conservazione sostitutiva certificata; accesso limitato</td></tr>
        </tbody>
      </table>

      <h2>6. Trattamento &mdash; Risorse umane</h2>
      <table>
        <tbody>
          <tr><th>Finalit&agrave;</th><td>Gestione del rapporto di lavoro / collaborazione con operatori</td></tr>
          <tr><th>Base giuridica</th><td>Esecuzione del contratto (art. 6.1.b GDPR), obbligo di legge</td></tr>
          <tr><th>Categorie di interessati</th><td>Operatori, collaboratori del salone</td></tr>
          <tr><th>Categorie di dati</th><td>Anagrafici, contrattuali, retributivi, presenze</td></tr>
          <tr><th>Destinatari</th><td>Consulente del lavoro, INPS, INAIL, Agenzia delle Entrate</td></tr>
          <tr><th>Trasferimenti extra-UE</th><td>Nessuno</td></tr>
          <tr><th>Conservazione</th><td>10 anni dopo la cessazione del rapporto</td></tr>
          <tr><th>Misure di sicurezza</th><td>Accesso limitato al solo titolare e consulente</td></tr>
        </tbody>
      </table>

      <h3>Note</h3>
      <ul>
        <li>Il presente Registro &egrave; un modello generato da Lume sulla base degli usi
          standard del settore acconciatura/estetica. Adattalo ai trattamenti effettivamente
          svolti dal tuo salone (es. videosorveglianza, vendita online, fidelity card fisica).</li>
        <li>Per ogni trattamento aggiuntivo aggiungi una nuova scheda con i medesimi otto campi.</li>
        <li>Conserva il registro aggiornato e accessibile per la durata dei trattamenti.</li>
      </ul>
    </>
  );
}
