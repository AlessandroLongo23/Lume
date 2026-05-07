import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termini di servizio — Lume',
  description: 'Condizioni generali di contratto del servizio Lume.',
};

export default function TermsPage() {
  return (
    <>
      <h1>Termini di servizio</h1>
      <p>
        <em>Ultimo aggiornamento: 7 maggio 2026.</em>
      </p>
      <p>
        Le presenti Condizioni Generali di Contratto (&laquo;<strong>Termini</strong>&raquo;)
        disciplinano l&apos;accesso e l&apos;utilizzo del servizio software-as-a-service{' '}
        <strong>Lume</strong> (&laquo;<strong>Servizio</strong>&raquo;), gestionale dedicato a
        saloni di acconciatura e barbieri. Utilizzando il Servizio, l&apos;utente accetta
        integralmente questi Termini.
      </p>

      {/* TODO: lawyer review — replace placeholder details before launch */}

      <h2>1. Oggetto</h2>
      <p>
        Lume mette a disposizione, in modalità SaaS, una piattaforma web per la gestione di
        clienti, appuntamenti, operatori, magazzino, ordini, contabilità e comunicazioni del
        salone. Questi Termini regolano il rapporto contrattuale tra Lume e il salone titolare
        dell&apos;abbonamento (&laquo;<strong>Cliente</strong>&raquo;).
      </p>

      <h2>2. Fornitore del Servizio</h2>
      <p>
        Il Servizio è fornito da <strong>Lume</strong>, contattabile all&apos;indirizzo{' '}
        <a href="mailto:info@lumeapp.it">info@lumeapp.it</a>. Ragione sociale, sede legale e
        partita IVA verranno indicati prima dell&apos;apertura commerciale.{' '}
        {/* TODO: lawyer review — finalize legal entity details */}
      </p>

      <h2>3. Registrazione e account</h2>
      <p>
        L&apos;accesso al Servizio è riservato a soggetti maggiorenni titolari di
        un&apos;attività di salone di acconciatura o barbieria con regolare partita IVA. In fase
        di registrazione il Cliente garantisce la veridicità e completezza dei dati forniti e si
        impegna a mantenerli aggiornati.
      </p>
      <p>
        Le credenziali di accesso sono personali e riservate: il Cliente è responsabile della
        loro custodia e di ogni attività compiuta tramite il proprio account, comprese le azioni
        di operatori e collaboratori autorizzati.
      </p>

      <h2>4. Abbonamento e prezzi</h2>
      <ul>
        <li>
          <strong>Piano mensile</strong>: € 49,00 al mese, IVA esclusa.
        </li>
        <li>
          <strong>Piano annuale</strong>: € 490,00 all&apos;anno, IVA esclusa (equivalente a due
          mensilità gratuite).
        </li>
      </ul>
      <p>
        I prezzi sono pubblicati sul sito di Lume e formano parte integrante dei presenti
        Termini. L&apos;abbonamento si rinnova automaticamente alla scadenza del periodo
        prescelto, salvo disdetta nei termini indicati al paragrafo 6.
      </p>

      <h2>5. Pagamento</h2>
      <p>
        I pagamenti sono elaborati per conto di Lume da <strong>Stripe Payments Europe Ltd.</strong>{' '}
        Il Cliente autorizza Stripe ad addebitare il canone sulla forma di pagamento indicata.
        Lume emette fattura elettronica per ciascun pagamento andato a buon fine.
      </p>
      <p>
        In caso di mancato o ritardato pagamento, Lume può sospendere l&apos;accesso al Servizio
        previa comunicazione e tentativo di riaddebito secondo le tempistiche standard del
        provider di pagamento.
      </p>

      <h2>6. Durata, rinnovo e recesso</h2>
      <p>
        L&apos;abbonamento ha durata pari al periodo prescelto (mensile o annuale) e si rinnova
        tacitamente per periodi di pari durata. Il Cliente può disdire il rinnovo in qualsiasi
        momento dall&apos;area di gestione dell&apos;abbonamento; la disdetta diventa efficace al
        termine del periodo di fatturazione in corso, senza diritto a rimborsi pro-quota.
      </p>
      <p>
        Trattandosi di un servizio rivolto a soggetti titolari di partita IVA per finalità
        professionali, non si applica il diritto di recesso di 14 giorni previsto dal Codice del
        Consumo (D.Lgs. 206/2005) per i contratti con i consumatori.{' '}
        {/* TODO: lawyer review — confirm B2B exclusion of consumer withdrawal right */}
      </p>

      <h2>7. Sospensione e cessazione</h2>
      <p>
        Lume può sospendere o risolvere il contratto, con preavviso ragionevole, in caso di:
      </p>
      <ul>
        <li>mancato pagamento del canone;</li>
        <li>violazione sostanziale dei presenti Termini;</li>
        <li>uso del Servizio in modo illecito, fraudolento o lesivo di terzi;</li>
        <li>obblighi imposti da provvedimenti dell&apos;autorità.</li>
      </ul>
      <p>
        In caso di cessazione, il Cliente ha a disposizione un periodo di trenta (30) giorni per
        scaricare i propri dati operativi tramite la funzione di esportazione resa disponibile da
        Lume, decorso il quale i dati saranno cancellati o resi anonimi. {/* TODO: lawyer review
        — confirm grace period and align with privacy retention */}
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
          italiana applicabile, fornendo loro le informative dovute;
        </li>
        <li>
          mantenere la riservatezza delle credenziali e segnalare tempestivamente a Lume qualsiasi
          uso non autorizzato del proprio account.
        </li>
      </ul>

      <h2>9. Proprietà dei dati del Cliente</h2>
      <p>
        I dati operativi inseriti dal Cliente nel Servizio (anagrafiche clienti, fiches,
        appuntamenti, dati contabili, prodotti, ordini) restano di proprietà esclusiva del
        Cliente. Lume agisce in qualità di responsabile del trattamento ai sensi dell&apos;art. 28
        GDPR e tratta tali dati esclusivamente per erogare il Servizio, secondo quanto descritto
        nell&apos;<a href="/privacy">Informativa sulla privacy</a>.
      </p>

      <h2>10. Disponibilità del Servizio</h2>
      <p>
        Lume si impegna ad assicurare la disponibilità del Servizio secondo standard ragionevoli
        di settore, senza tuttavia garantire un livello di servizio (SLA) contrattualmente
        vincolante. Gli interventi di manutenzione programmata sono comunicati con preavviso via
        email o avviso in app. {/* TODO: lawyer review — confirm uptime commitments */}
      </p>

      <h2>11. Proprietà intellettuale</h2>
      <p>
        Il software, i marchi, i loghi, i contenuti del sito e ogni altro elemento del Servizio
        sono di proprietà esclusiva di Lume o dei rispettivi titolari. Nessuna licenza è concessa
        al Cliente al di fuori del diritto, non esclusivo e non trasferibile, di utilizzare il
        Servizio per la durata dell&apos;abbonamento.
      </p>

      <h2>12. Limitazione di responsabilità</h2>
      <p>
        Nei limiti consentiti dalla legge, Lume non risponde di danni indiretti, perdita di
        profitti, perdita di clientela o di dati derivante da eventi non imputabili a propria
        colpa grave o dolo. In ogni caso, la responsabilità complessiva di Lume verso il Cliente
        non potrà eccedere il totale dei canoni effettivamente corrisposti dal Cliente nei dodici
        (12) mesi precedenti l&apos;evento da cui deriva la pretesa.{' '}
        {/* TODO: lawyer review — confirm enforceability of liability cap under Italian law */}
      </p>

      <h2>13. Modifiche al Servizio e ai Termini</h2>
      <p>
        Lume può evolvere il Servizio, aggiungendo, modificando o dismettendo funzionalità.
        Eventuali modifiche sostanziali a questi Termini saranno comunicate al Cliente con
        preavviso ragionevole via email o avviso in app; la prosecuzione nell&apos;uso del
        Servizio dopo la data di efficacia equivale ad accettazione delle modifiche.
      </p>

      <h2>14. Legge applicabile e foro competente</h2>
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per ogni controversia derivante
        dal contratto è competente in via esclusiva il foro della sede legale di Lume, salvo
        norme inderogabili di legge.{' '}
        {/* TODO: lawyer review — finalize foro competente once legal entity is registered */}
      </p>

      <h2>15. Contatti</h2>
      <p>
        Per qualsiasi domanda relativa a questi Termini:{' '}
        <a href="mailto:info@lumeapp.it">info@lumeapp.it</a>.
      </p>
    </>
  );
}
