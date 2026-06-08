import type { Tutorial } from './types';
import { hasClients, hasServices, hasOperators, hasProducts, hasSuppliers, hasFiches, hasOpenFiches } from './prerequisites';

/**
 * Source of truth for the Help Center hub. Each entry is a learning topic; the
 * matching interactive tour (if any) lives in `./tours`. Content (video/article)
 * is filled in Phase 4 — for now entries drive the hub + interactive guides.
 */
export const tutorials: Tutorial[] = [
  {
    id: 'intro',
    slug: 'primi-passi',
    title: 'Primi passi con Lume',
    summary:
      'Una panoramica delle sezioni principali e come creare il tuo primo cliente, servizio, prodotto e appuntamento.',
    complexity: 'base',
    scopes: ['generale', 'agenda', 'clienti', 'servizi', 'prodotti'],
    tourId: 'intro',
    isIntro: true,
    welcome: {
      title: 'Benvenuto in Lume',
      body: 'Ti accompagniamo in un breve giro delle sezioni principali. Puoi uscire quando vuoi e riprendere dalla pagina Aiuto.',
    },
  },
  {
    id: 'crea-cliente',
    slug: 'crea-cliente',
    title: 'Aggiungere un cliente',
    summary:
      'Aggiungi una persona alla tua lista clienti — nome, contatti e una nota — in meno di un minuto.',
    complexity: 'base',
    scopes: ['clienti'],
    tourId: 'crea-cliente',
    articleSlug: 'crea-cliente',
  },
  {
    id: 'crea-servizio',
    slug: 'crea-servizio',
    title: 'Aggiungere un servizio',
    summary:
      'Crea una voce del tuo listino — nome, categoria, durata e prezzo — pronta da usare nelle fiche.',
    complexity: 'base',
    scopes: ['servizi'],
    tourId: 'crea-servizio',
    articleSlug: 'crea-servizio',
  },
  {
    id: 'crea-categoria-servizio',
    slug: 'crea-categoria-servizio',
    title: 'Organizzare i servizi in categorie',
    summary:
      'Crea e gestisci le categorie del listino — nome, colore e descrizione — per tenere i tuoi servizi ordinati.',
    complexity: 'base',
    scopes: ['servizi'],
    tourId: 'crea-categoria-servizio',
    articleSlug: 'crea-categoria-servizio',
  },
  {
    id: 'crea-prodotto',
    slug: 'crea-prodotto',
    title: 'Aggiungere un prodotto',
    summary:
      'Aggiungi un prodotto al magazzino — nome e prezzo, e se vuoi marca, categoria e fornitore — pronto per fiche e ordini.',
    complexity: 'base',
    scopes: ['prodotti'],
    tourId: 'crea-prodotto',
    articleSlug: 'crea-prodotto',
  },
  {
    id: 'crea-operatore',
    slug: 'crea-operatore',
    title: 'Aggiungere un operatore',
    summary:
      'Crea un membro del tuo staff — nome e cognome, e se vuoi le credenziali per accedere — pronto da assegnare a fiche e appuntamenti.',
    complexity: 'base',
    scopes: ['operatori'],
    tourId: 'crea-operatore',
    articleSlug: 'crea-operatore',
  },
  {
    id: 'usare-calendario',
    slug: 'usare-calendario',
    title: 'Muoversi nel calendario',
    summary:
      'Trova la tua strada nell\'agenda: spostati tra le date, cambia tra le viste giorno, settimana e mese, e filtra per operatore.',
    complexity: 'base',
    scopes: ['agenda'],
    tourId: 'usare-calendario',
    articleSlug: 'usare-calendario',
    prerequisites: [
      { label: 'almeno un operatore', met: hasOperators, tutorialId: 'crea-operatore' },
    ],
  },
  {
    id: 'prenota-appuntamento',
    slug: 'prenota-appuntamento',
    title: 'Prenotare un appuntamento',
    summary:
      'Trasforma uno spazio libero del calendario in un appuntamento: scegli orario, cliente, servizio e operatore in pochi clic.',
    complexity: 'base',
    scopes: ['agenda', 'fiches'],
    tourId: 'prenota-appuntamento',
    articleSlug: 'prenota-appuntamento',
    prerequisites: [
      { label: 'almeno un cliente', met: hasClients, tutorialId: 'crea-cliente' },
      { label: 'almeno un servizio', met: hasServices, tutorialId: 'crea-servizio' },
      { label: 'almeno un operatore', met: hasOperators, tutorialId: 'crea-operatore' },
    ],
  },
  {
    id: 'modifica-appuntamento',
    slug: 'modifica-appuntamento',
    title: 'Spostare, modificare o cancellare un appuntamento',
    summary:
      'Sposta un appuntamento trascinandolo, allungane o accorciane la durata, modificane i dettagli o eliminalo — tutto dal calendario.',
    complexity: 'base',
    scopes: ['agenda', 'fiches'],
    tourId: 'modifica-appuntamento',
    articleSlug: 'modifica-appuntamento',
    prerequisites: [
      { label: 'almeno un appuntamento in agenda', met: hasFiches, tutorialId: 'prenota-appuntamento' },
    ],
  },
  {
    id: 'crea-fiche',
    slug: 'crea-fiche',
    title: 'Registrare una fiche',
    summary:
      'Trasforma una visita in scontrino: aggiungi i servizi svolti e i prodotti venduti, poi salva la fiche pronta da incassare.',
    complexity: 'base',
    scopes: ['fiches'],
    tourId: 'crea-fiche',
    articleSlug: 'crea-fiche',
    prerequisites: [
      { label: 'almeno un cliente', met: hasClients, tutorialId: 'crea-cliente' },
      { label: 'almeno un servizio', met: hasServices, tutorialId: 'crea-servizio' },
      { label: 'almeno un prodotto', met: hasProducts, tutorialId: 'crea-prodotto' },
    ],
  },
  {
    id: 'incassa-fiche',
    slug: 'incassa-fiche',
    title: 'Incassare e chiudere la fiche',
    summary:
      'Apri una fiche da incassare, scegli il metodo di pagamento e — con i contanti — vedi al volo il resto da dare al cliente.',
    complexity: 'base',
    scopes: ['fiches', 'bilancio'],
    tourId: 'incassa-fiche',
    articleSlug: 'incassa-fiche',
    prerequisites: [
      { label: 'almeno una fiche da incassare', met: hasOpenFiches, tutorialId: 'crea-fiche' },
    ],
  },
  {
    id: 'scheda-cliente',
    slug: 'scheda-cliente',
    title: 'La scheda cliente',
    summary:
      'Apri la scheda di un cliente per vedere foto, contatti, storico delle visite, scheda tecnica e note — tutto in un colpo d\'occhio.',
    complexity: 'base',
    scopes: ['clienti'],
    tourId: 'scheda-cliente',
    articleSlug: 'scheda-cliente',
    prerequisites: [
      { label: 'almeno un cliente', met: hasClients, tutorialId: 'crea-cliente' },
    ],
  },
  {
    id: 'gestisci-prenotazioni',
    slug: 'gestisci-prenotazioni',
    title: 'Gestire le richieste di prenotazione online',
    summary:
      'Approva o rifiuta le richieste arrivate dal sito: con un clic confermi l\'appuntamento e avvisi il cliente, oppure liberi lo spazio.',
    complexity: 'avanzato',
    scopes: ['prenotazioni', 'agenda'],
    tourId: 'gestisci-prenotazioni',
    articleSlug: 'gestisci-prenotazioni',
    // No prerequisites: pending requests are produced by clients on the public
    // booking site, not by any tutorial — and `tourQueue.runnable()` drops a
    // chained tutorial that has no tour, so a prerequisite chain can't guarantee
    // the inbox is non-empty. The tour is instead self-robust to an empty inbox
    // (it spotlights only the stable page + tab anchors). See the tour's doc comment.
  },
  {
    id: 'crea-coupon',
    slug: 'crea-coupon',
    title: 'Creare un coupon',
    summary:
      'Prepara un buono sconto per un cliente — percentuale, importo fisso o servizio omaggio — pronto da applicare in fiche.',
    complexity: 'avanzato',
    scopes: ['coupons'],
    tourId: 'crea-coupon',
    articleSlug: 'crea-coupon',
    prerequisites: [
      { label: 'almeno un cliente', met: hasClients, tutorialId: 'crea-cliente' },
    ],
  },
  {
    id: 'applica-sconto',
    slug: 'applica-sconto',
    title: 'Applicare uno sconto a una fiche',
    summary:
      'Scala il coupon del cliente sul totale della fiche, con il calcolo automatico del nuovo importo da incassare.',
    complexity: 'avanzato',
    scopes: ['fiches', 'coupons'],
    comingSoon: true,
  },
  {
    id: 'crea-abbonamento',
    slug: 'crea-abbonamento',
    title: 'Creare un abbonamento',
    summary:
      'Configura un pacchetto di sedute prepagato per un cliente — servizi inclusi, numero di sedute, prezzo scontato e incasso — pronto da scalare a ogni visita.',
    complexity: 'avanzato',
    scopes: ['abbonamenti'],
    tourId: 'crea-abbonamento',
    articleSlug: 'crea-abbonamento',
    prerequisites: [
      { label: 'almeno un cliente', met: hasClients, tutorialId: 'crea-cliente' },
      { label: 'almeno un servizio', met: hasServices, tutorialId: 'crea-servizio' },
    ],
  },
  {
    id: 'vendi-gift-card',
    slug: 'vendi-gift-card',
    title: 'Vendere una gift card',
    summary:
      'Emetti una gift card di un importo a scelta: scegli acquirente e destinatario, la validità, e avvisa subito chi la riceve. Il credito si spende poi in una fiche come metodo di pagamento.',
    complexity: 'avanzato',
    scopes: ['coupons'],
    tourId: 'vendi-gift-card',
    articleSlug: 'vendi-gift-card',
    prerequisites: [
      { label: 'almeno un cliente', met: hasClients, tutorialId: 'crea-cliente' },
    ],
  },
  {
    id: 'gestione-giacenza',
    slug: 'gestione-giacenza',
    title: 'Gestire la giacenza',
    summary:
      'Attiva il tracciamento delle scorte, imposta giacenze e soglie minime, e tieni le quantità aggiornate con un clic — con l\'avviso rosso quando un prodotto sta finendo.',
    complexity: 'avanzato',
    scopes: ['prodotti'],
    tourId: 'gestione-giacenza',
    articleSlug: 'gestione-giacenza',
    prerequisites: [
      { label: 'almeno un prodotto', met: hasProducts, tutorialId: 'crea-prodotto' },
    ],
  },
  {
    id: 'marche-fornitori',
    slug: 'marche-fornitori',
    title: 'Marche, fornitori e categorie prodotto',
    summary:
      'Crea le anagrafiche che tengono in ordine il magazzino — i marchi dei prodotti, i fornitori da cui li acquisti e le categorie con cui li raggruppi.',
    complexity: 'avanzato',
    scopes: ['prodotti'],
    tourId: 'marche-fornitori',
    articleSlug: 'marche-fornitori',
    // No prerequisites: marchi, fornitori e categorie prodotto are standalone
    // registries that need no pre-existing data (unlike a product, which the
    // crea-prodotto tour chains). They are themselves the building blocks the
    // crea-ordine tutorial chains to (a fornitore must exist first).
  },
  {
    id: 'crea-ordine',
    slug: 'crea-ordine',
    title: 'Creare un ordine a un fornitore',
    summary:
      'Registra una richiesta di riassortimento a un fornitore — con data e stato — e segui l\'ordine da "In attesa" fino a "Consegnato" quando la merce arriva.',
    complexity: 'avanzato',
    scopes: ['prodotti'],
    tourId: 'crea-ordine',
    articleSlug: 'crea-ordine',
    // Only a fornitore is required: an order in Lume carries a supplier, a
    // datetime and a status (no order-line items in the form), so products are
    // not a prerequisite. The fornitore registry is taught by marche-fornitori.
    prerequisites: [
      { label: 'almeno un fornitore', met: hasSuppliers, tutorialId: 'marche-fornitori' },
    ],
  },
  {
    id: 'configura-prenotazioni-online',
    slug: 'configura-prenotazioni-online',
    title: 'Attivare le prenotazioni online',
    summary:
      'Pubblica la pagina di prenotazione del salone: scegli quali servizi mostrare, gli orari disponibili e come gestire le richieste in arrivo.',
    complexity: 'avanzato',
    scopes: ['prenotazioni'],
    comingSoon: true,
  },
  {
    id: 'raccogli-recensioni',
    slug: 'raccogli-recensioni',
    title: 'Raccogliere recensioni dai clienti',
    summary:
      'Invia automaticamente la richiesta di recensione dopo la visita e monitora i feedback in arrivo dai tuoi clienti.',
    complexity: 'avanzato',
    scopes: ['recensioni'],
    comingSoon: true,
  },
  {
    id: 'leggi-bilancio',
    slug: 'leggi-bilancio',
    title: 'Leggere il bilancio del salone',
    summary:
      'Capisci a colpo d\'occhio incassi, spese e margini del mese, e scarica il report da condividere con il commercialista.',
    complexity: 'base',
    scopes: ['bilancio'],
    comingSoon: true,
  },
  {
    id: 'analizza-statistiche',
    slug: 'analizza-statistiche',
    title: 'Analizzare le statistiche',
    summary:
      'Scopri i servizi più richiesti, gli operatori più produttivi e i clienti più fedeli con i grafici della sezione Statistiche.',
    complexity: 'avanzato',
    scopes: ['bilancio'],
    comingSoon: true,
  },
  {
    id: 'configura-salone',
    slug: 'configura-salone',
    title: 'Configurare orari e dati del salone',
    summary:
      'Imposta gli orari di apertura, i dati di fatturazione, il logo e le preferenze generali del tuo salone.',
    complexity: 'base',
    scopes: ['impostazioni'],
    comingSoon: true,
  },
  {
    id: 'importa-clienti',
    slug: 'importa-clienti',
    title: 'Importare i clienti da un altro gestionale',
    summary:
      'Porta in Lume la tua anagrafica esistente: prepara il file, controlla l\'anteprima e completa l\'importazione in pochi passi.',
    complexity: 'avanzato',
    scopes: ['clienti'],
    comingSoon: true,
  },
];

export function getTutorialBySlug(slug: string): Tutorial | null {
  return tutorials.find((t) => t.slug === slug) ?? null;
}

export function getTutorialById(id: string): Tutorial | null {
  return tutorials.find((t) => t.id === id) ?? null;
}

export function getIntroTutorial(): Tutorial | null {
  return tutorials.find((t) => t.isIntro) ?? null;
}
