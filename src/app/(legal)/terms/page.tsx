import type { Metadata } from 'next';
import Link from 'next/link';
import { LUME_LEGAL, formatLumeAddress, formatLumeIdentity } from '@/lib/const/legal';
import { LEGAL_VERSIONS } from '@/lib/const/legalVersions';

export const metadata: Metadata = {
  title: 'Termini di servizio — Lume',
  description: 'Condizioni generali di contratto del servizio Lume.',
};

export default function TermsPage() {
  return (
    <>
      <h1>Termini di servizio</h1>
      <p>
        <em>Versione {LEGAL_VERSIONS.terms}.</em>
      </p>
      <p>
        Le presenti Condizioni Generali di Contratto (&laquo;<strong>Termini</strong>&raquo;)
        disciplinano l&apos;accesso e l&apos;utilizzo del servizio software-as-a-service{' '}
        <strong>Lume</strong> (&laquo;<strong>Servizio</strong>&raquo;), gestionale dedicato a
        saloni di acconciatura e barbieri. Utilizzando il Servizio, l&apos;utente accetta
        integralmente questi Termini.
      </p>

      <h2>1. Oggetto</h2>
      <p>
        Lume mette a disposizione, in modalit&agrave; SaaS, una piattaforma web per la gestione
        di clienti, appuntamenti, operatori, magazzino, ordini, contabilit&agrave; e
        comunicazioni del salone. Questi Termini regolano il rapporto contrattuale tra Lume e il
        salone titolare dell&apos;abbonamento (&laquo;<strong>Cliente</strong>&raquo;).
      </p>

      <h2>2. Fornitore del Servizio</h2>
      <p>
        Il Servizio &egrave; fornito da <strong>{formatLumeIdentity()}</strong>
        {LUME_LEGAL.address.country
          ? `, con sede in ${formatLumeAddress() || LUME_LEGAL.address.country}`
          : ''}
        , contattabile all&apos;indirizzo{' '}
        <a href={`mailto:${LUME_LEGAL.supportEmail}`}>{LUME_LEGAL.supportEmail}</a>.
      </p>

      <h2>3. Registrazione e account</h2>
      <p>
        L&apos;accesso al Servizio &egrave; riservato a soggetti maggiorenni titolari di
        un&apos;attivit&agrave; di salone di acconciatura o barbieria con regolare partita IVA.
        In fase di registrazione il Cliente garantisce la veridicit&agrave; e completezza dei
        dati forniti e si impegna a mantenerli aggiornati.
      </p>
      <p>
        Le credenziali di accesso sono personali e riservate: il Cliente &egrave; responsabile
        della loro custodia e di ogni attivit&agrave; compiuta tramite il proprio account,
        comprese le azioni di operatori e collaboratori autorizzati.
      </p>

      <h2>4. Abbonamento e prezzi</h2>
      <ul>
        <li>
          <strong>Piano mensile</strong>: € 49,00 al mese.
        </li>
        <li>
          <strong>Piano annuale</strong>: € 490,00 all&apos;anno (equivalente a due mensilit&agrave;
          gratuite).
        </li>
      </ul>
      <p>
        I prezzi sono pubblicati sul sito di Lume e formano parte integrante dei presenti
        Termini. L&apos;abbonamento si rinnova automaticamente alla scadenza del periodo
        prescelto, salvo disdetta nei termini indicati al paragrafo 6.
      </p>

      <h2>5. Pagamento e fatturazione</h2>
      <p>
        I pagamenti sono elaborati per conto di Lume da{' '}
        <strong>Stripe Payments Europe Ltd.</strong> Il Cliente autorizza Stripe ad addebitare il
        canone sulla forma di pagamento indicata. Lume emette fattura per ciascun pagamento
        andato a buon fine.
      </p>
      <p>
        <strong>IVA &mdash; reverse charge intracomunitario.</strong> Lume &egrave; stabilita in
        Danimarca. Per i Clienti italiani titolari di partita IVA, il Servizio &egrave; soggetto
        al meccanismo del <em>reverse charge</em> ai sensi dell&apos;art. 196 della Direttiva
        2006/112/CE: Lume emette fattura senza addebito di IVA, e il Cliente &egrave; tenuto a
        integrare la fattura con l&apos;IVA italiana al 22% mediante autofattura elettronica
        TD17 trasmessa al Sistema di Interscambio (SDI). Per Clienti UE non italiani si applica
        il regime di reverse charge ordinario; per Clienti extra-UE l&apos;operazione &egrave;
        non imponibile.
      </p>
      <p>
        In caso di mancato o ritardato pagamento, Lume pu&ograve; sospendere l&apos;accesso al
        Servizio previa comunicazione e tentativo di riaddebito secondo le tempistiche standard
        del provider di pagamento.
      </p>

      <h2>6. Durata, rinnovo e recesso</h2>
      <p>
        L&apos;abbonamento ha durata pari al periodo prescelto (mensile o annuale) e si rinnova
        tacitamente per periodi di pari durata. Il Cliente pu&ograve; disdire il rinnovo in
        qualsiasi momento dall&apos;area di gestione dell&apos;abbonamento; la disdetta diventa
        efficace al termine del periodo di fatturazione in corso, senza diritto a rimborsi
        pro-quota.
      </p>
      <p>
        Trattandosi di un servizio rivolto a soggetti titolari di partita IVA per finalit&agrave;
        professionali, non si applica il diritto di recesso di 14 giorni previsto dal Codice del
        Consumo (D.Lgs. 206/2005) per i contratti con i consumatori.
      </p>

      <h2>7. Sospensione e cessazione</h2>
      <p>Lume pu&ograve; sospendere o risolvere il contratto, con preavviso ragionevole, in caso di:</p>
      <ul>
        <li>mancato pagamento del canone;</li>
        <li>violazione sostanziale dei presenti Termini;</li>
        <li>uso del Servizio in modo illecito, fraudolento o lesivo di terzi;</li>
        <li>obblighi imposti da provvedimenti dell&apos;autorit&agrave;.</li>
      </ul>
      <p>
        In caso di cessazione, il Cliente ha a disposizione un periodo di trenta (30) giorni per
        scaricare i propri dati operativi tramite la funzione di esportazione resa disponibile da
        Lume (<Link href="/admin/impostazioni/account/dati">Esporta dati</Link>), decorso il
        quale i dati saranno cancellati o resi anonimi.
      </p>

      <h2>8. Obblighi dell&apos;utente</h2>
      <p>Il Cliente si impegna a:</p>
      <ul>
        <li>
          utilizzare il Servizio nel rispetto della legge e di questi Termini, senza arrecare
          danno a Lume o a terzi;
        </li>
        <li>
          non effettuare reverse engineering, decompilazione, scraping massivo o qualunque
          tentativo di accesso non autorizzato al Servizio o alla sua infrastruttura;
        </li>
        <li>
          trattare i dati dei propri clienti finali nel rispetto del GDPR e della normativa
          italiana applicabile, fornendo loro le informative dovute (modulistica disponibile
          nella sezione <Link href="/admin/impostazioni/legale/deliberatorie">Deliberatorie</Link>);
        </li>
        <li>
          mantenere la riservatezza delle credenziali e segnalare tempestivamente a Lume qualsiasi
          uso non autorizzato del proprio account.
        </li>
      </ul>

      <h2>9. Propriet&agrave; dei dati del Cliente</h2>
      <p>
        I dati operativi inseriti dal Cliente nel Servizio (anagrafiche clienti, fiches,
        appuntamenti, dati contabili, prodotti, ordini) restano di propriet&agrave; esclusiva del
        Cliente. Lume agisce in qualit&agrave; di responsabile del trattamento ai sensi
        dell&apos;art. 28 GDPR e tratta tali dati esclusivamente per erogare il Servizio, secondo
        quanto descritto nell&apos;<Link href="/privacy">Informativa sulla privacy</Link> e nel{' '}
        <Link href="/dpa">Data Processing Agreement</Link>.
      </p>

      <h2>10. Disponibilit&agrave; del Servizio</h2>
      <p>
        Lume si impegna ad assicurare la disponibilit&agrave; del Servizio secondo standard
        ragionevoli di settore, senza tuttavia garantire un livello di servizio (SLA)
        contrattualmente vincolante. Gli interventi di manutenzione programmata sono comunicati
        con preavviso via email o avviso in app.
      </p>

      <h2>11. Propriet&agrave; intellettuale</h2>
      <p>
        Il software, i marchi, i loghi, i contenuti del sito e ogni altro elemento del Servizio
        sono di propriet&agrave; esclusiva di Lume o dei rispettivi titolari. Nessuna licenza
        &egrave; concessa al Cliente al di fuori del diritto, non esclusivo e non trasferibile,
        di utilizzare il Servizio per la durata dell&apos;abbonamento.
      </p>

      <h2>12. Limitazione di responsabilit&agrave;</h2>
      <p>
        Nei limiti consentiti dalla legge, e fatto salvo quanto disposto dall&apos;art. 1229 c.c.
        (nessuna esclusione di responsabilit&agrave; per dolo o colpa grave), Lume non risponde
        di danni indiretti, perdita di profitti, perdita di clientela o di dati derivante da
        eventi non imputabili a propria colpa grave o dolo. In ogni caso, la
        responsabilit&agrave; complessiva di Lume verso il Cliente non potr&agrave; eccedere il
        totale dei canoni effettivamente corrisposti dal Cliente nei dodici (12) mesi precedenti
        l&apos;evento da cui deriva la pretesa.
      </p>

      <h2>13. Modifiche al Servizio e ai Termini</h2>
      <p>
        Lume pu&ograve; evolvere il Servizio, aggiungendo, modificando o dismettendo
        funzionalit&agrave;. Eventuali modifiche sostanziali a questi Termini saranno comunicate
        al Cliente con preavviso ragionevole via email o avviso in app; la prosecuzione
        nell&apos;uso del Servizio dopo la data di efficacia equivale ad accettazione delle
        modifiche.
      </p>

      <h2>14. Legge applicabile e foro competente</h2>
      <p>
        I presenti Termini sono regolati dalla <strong>legge danese</strong>. Per ogni
        controversia derivante dal contratto &egrave; competente in via esclusiva il{' '}
        <strong>foro di {LUME_LEGAL.foro}</strong>. Restano comunque salve le norme imperative
        di tutela del Cliente eventualmente applicabili in base al diritto del Paese di sua
        residenza ai sensi dell&apos;art. 9 del Regolamento Roma I (Reg. CE 593/2008), inclusi i
        diritti riconosciuti dagli artt. 1341 e 1342 c.c. ai Clienti italiani.
      </p>

      <h2>15. Trattamento dei dati personali</h2>
      <p>
        Il trattamento dei dati personali raccolti nell&apos;ambito del Servizio &egrave;
        descritto in dettaglio nell&apos;<Link href="/privacy">Informativa sulla privacy</Link>{' '}
        e regolato dal <Link href="/dpa">Data Processing Agreement (DPA)</Link>, parte integrante
        dei presenti Termini. L&apos;elenco aggiornato dei sub-responsabili &egrave; pubblicato
        alla pagina <Link href="/sub-processors">Sub-processors</Link>.
      </p>

      <h2>16. Clausole vessatorie &mdash; approvazione specifica (artt. 1341 e 1342 c.c.)</h2>
      <p>
        Ai sensi e per gli effetti degli artt. 1341 e 1342 del Codice Civile italiano, il
        Cliente, dopo averne presa attenta visione, approva specificamente per iscritto le
        seguenti clausole dei presenti Termini, che gli vengono riportate per intero:
      </p>
      <ul>
        <li>
          <strong>5</strong> (sospensione del Servizio in caso di mancato pagamento, con
          riaddebito secondo le tempistiche del provider di pagamento);
        </li>
        <li>
          <strong>6</strong> (rinnovo tacito dell&apos;abbonamento ed esclusione del diritto a
          rimborsi pro-quota in caso di disdetta in corso di periodo, esclusione del diritto di
          recesso di cui al Codice del Consumo);
        </li>
        <li>
          <strong>7</strong> (facolt&agrave; di sospensione e risoluzione unilaterale del
          contratto da parte di Lume per le ipotesi ivi indicate);
        </li>
        <li>
          <strong>10</strong> (assenza di SLA contrattualmente vincolante);
        </li>
        <li>
          <strong>12</strong> (limitazione della responsabilit&agrave; di Lume al totale dei
          canoni dei 12 mesi precedenti);
        </li>
        <li>
          <strong>13</strong> (facolt&agrave; di modifica unilaterale del Servizio e dei
          Termini);
        </li>
        <li>
          <strong>14</strong> (legge danese applicabile e foro convenzionale di {LUME_LEGAL.foro}).
        </li>
      </ul>
      <p>
        L&apos;approvazione specifica di tali clausole avviene tramite spunta di apposita casella
        in fase di registrazione, distinta e successiva rispetto all&apos;accettazione generale
        dei Termini. La registrazione &egrave; tracciata nel Registro delle accettazioni di Lume
        (timestamp, indirizzo IP, user-agent, versione del documento).
      </p>

      <h2>17. Contatti</h2>
      <p>
        <a href={`mailto:${LUME_LEGAL.supportEmail}`}>{LUME_LEGAL.supportEmail}</a>
      </p>
    </>
  );
}
