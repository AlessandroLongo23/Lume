import type { LumeTour } from '../types';

/**
 * Interactive tours, keyed by `tour` (matches `Tutorial.tourId`). NextStep is fed
 * the full list; a tour starts via `useNextStep().startNextStep(id)`.
 *
 * ── Authoring principles (apply per tour) ──────────────────────────────────
 *  • Prefer NAVIGATING to the page you're describing over highlighting a nav
 *    button from afar — the user should see the real screen (even if empty).
 *  • Make it interactive with the ACTION + NARRATION split: an ACTION step
 *    (`mode:'action'`) is completed by the user doing something. For navigation,
 *    set `advanceOnRoute` and the user clicks the highlighted link — `TourBridge`
 *    advances when the app reaches that route. Follow it with a NARRATION step
 *    that explains the now-open page.
 *  • `endRoute` returns the user where they came from when the tour completes or
 *    is skipped (handled in the layout's onComplete/onSkip — NextStep never
 *    navigates on the last step).
 *
 * Selectors target stable `data-tour` anchors (see Sidebar `dataTour`). The
 * centred welcome splash is a separate cross-fading overlay (`TourWelcome`).
 */
const introTour: LumeTour = {
  tour: 'intro',
  endRoute: '/admin/aiuto/primi-passi',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Calendario',
      content: 'Clicca su Calendario qui nella barra laterale per aprirlo.',
      selector: '[data-tour="nav-calendario"]',
      side: 'right',
      advanceOnRoute: '/admin/calendario',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Il Calendario',
      content:
        'Questo è il Calendario, il cuore di Lume: qui vedi la giornata e crei gli appuntamenti dei tuoi clienti.',
      selector: '[data-tour="nav-calendario"]',
      side: 'right',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri i Clienti',
      content: 'Ora clicca su Clienti nella barra laterale.',
      selector: '[data-tour="nav-clienti"]',
      side: 'right',
      advanceOnRoute: '/admin/clienti',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'I Clienti',
      content:
        'Qui trovi tutti i tuoi clienti: contatti, storico degli appuntamenti e preferenze, sempre a portata di mano.',
      selector: '[data-tour="nav-clienti"]',
      side: 'right',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri le Fiches',
      content: 'Apri la sezione Fiches dalla barra laterale.',
      selector: '[data-tour="nav-fiches"]',
      side: 'right',
      advanceOnRoute: '/admin/fiches',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Le Fiches',
      content:
        'La fiche è la scheda di un appuntamento: servizi, prodotti e incasso. È così che registri il lavoro svolto.',
      selector: '[data-tour="nav-fiches"]',
      side: 'right',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Bilancio',
      content: 'Per finire, apri il Bilancio dalla barra laterale.',
      selector: '[data-tour="nav-bilancio"]',
      side: 'right',
      advanceOnRoute: '/admin/bilancio',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Il Bilancio',
      content:
        'Nel Bilancio tieni sotto controllo entrate, uscite e cassa del salone, sempre aggiornati. Da qui capisci come sta andando.',
      selector: '[data-tour="nav-bilancio"]',
      side: 'right',
      pointerPadding: 6,
      pointerRadius: 8,
    },
  ],
};

/**
 * Create-a-client task tour. Each step highlights exactly the element it talks
 * about, and interaction is locked to that element (the default click-blocking
 * overlay). The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Clienti page (spotlight the page).
 *  2. ACTION  — open the modal (advance on `client:modal-open`, emitted on the
 *     modal's onEnterComplete so the next step measures the settled layout).
 *  3. ACTION  — write the nome; `advanceWhenFilled` keeps "Avanti" disabled until
 *     the field has a value, then the user clicks Avanti.
 *  4. ACTION  — write the cognome (same gating).
 *  5. ACTION  — save (advance on `client:created`).
 *  6. ACTION  — search for the just-created client (gated on the search field).
 *  7. NARRATE — wrap up over the whole page (spotlight the page).
 * No `startRoute`: step 0 is itself the navigation action, so pre-navigating
 * would skip it.
 */
const creaClienteTour: LumeTour = {
  tour: 'crea-cliente',
  endRoute: '/admin/aiuto/crea-cliente',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri i Clienti',
      content: 'Clicca su Clienti nella barra laterale per aprire la tua lista.',
      selector: '[data-tour="nav-clienti"]',
      side: 'right',
      advanceOnRoute: '/admin/clienti',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Clienti',
      content:
        'Questa è la sezione Clienti: qui vivono tutte le persone del tuo salone, con contatti, storico e preferenze. Aggiungiamone una nuova.',
      selector: '[data-tour="clienti-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo cliente"',
      content: 'Clicca "Nuovo cliente" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-client-create"]',
      side: 'bottom',
      completeOn: 'client:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome',
      content:
        'Scrivi il nome del cliente, poi clicca Avanti. Nome e cognome sono gli unici campi obbligatori.',
      selector: '[data-tour="field-client-first_name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-client-first_name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il cognome',
      content:
        'Ora scrivi il cognome e clicca Avanti. Email e telefono sono facoltativi: puoi aggiungerli più tardi.',
      selector: '[data-tour="field-client-last_name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-client-last_name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva il cliente',
      content: 'Clicca "Aggiungi" per salvare il cliente.',
      selector: '[data-tour="save-client"]',
      side: 'top',
      completeOn: 'client:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Ritrova il cliente',
      content:
        'Il nuovo cliente è in fondo alla lista. Per ritrovarlo, scrivi il suo nome qui nella ricerca, poi clicca Avanti.',
      selector: 'input[placeholder="Cerca cliente..."]',
      side: 'bottom',
      advanceWhenFilled: 'input[placeholder="Cerca cliente..."]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Ecco i tuoi clienti',
      content:
        'Eccolo! Ogni cliente che aggiungi vive qui: apri la sua scheda per vedere lo storico, modificare i contatti o prenotare un appuntamento.',
      selector: '[data-tour="clienti-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Create-a-service task tour. Same locked-overlay create-flow shape as
 * `crea-cliente`, with one twist: the "Categoria" field is a custom `Select`
 * whose dropdown portals at `z-popover` (below the tour overlay), so it is only
 * visible and clickable inside the spotlight hole. So the category step spotlights
 * the WHOLE form (`[data-tour="service-form"]`) — the hole then contains the open
 * dropdown — and advances on `service:category-selected` (emitted from the modal's
 * onChange) rather than `advanceWhenFilled`, which can't read a value off a Select.
 * The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Servizi page (spotlight the page).
 *  2. ACTION  — open the modal (advance on `service:modal-open`).
 *  3. ACTION  — write the nome; `advanceWhenFilled` gates "Avanti".
 *  4. ACTION  — pick the categoria (spotlight the form; advance on selection).
 *  5-8. ACTION (optional) — durata, prezzo, costo, descrizione: each highlighted
 *       and editable but skippable via "Salta" (none is required to save).
 *  9. ACTION  — save (advance on `service:created`).
 * 10. ACTION  — search for the just-created service (gated on the search field).
 * 11. NARRATE — wrap up over the whole page (spotlight the page).
 */
const creaServizioTour: LumeTour = {
  tour: 'crea-servizio',
  endRoute: '/admin/aiuto/crea-servizio',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri i Servizi',
      content: 'Clicca su Servizi nella barra laterale per aprire il tuo listino.',
      selector: '[data-tour="nav-servizi"]',
      side: 'right',
      advanceOnRoute: '/admin/servizi',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Servizi',
      content:
        'Questo è il tuo listino: ogni trattamento che offri vive qui, con la sua durata e il suo prezzo. Aggiungiamone uno nuovo.',
      selector: '[data-tour="servizi-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo Servizio"',
      content: 'Clicca "Nuovo Servizio" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-service-create"]',
      side: 'bottom',
      completeOn: 'service:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome',
      content:
        'Scrivi il nome del servizio, per esempio "Piega serale", poi clicca Avanti. Nome e categoria sono gli unici campi obbligatori.',
      selector: '[data-tour="field-service-name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-service-name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli la categoria',
      content:
        'Apri il menù "Categoria" e scegli a quale gruppo appartiene il servizio. La categoria aiuta a tenere il listino ordinato.',
      // Spotlight the whole form, not just the Select: its dropdown opens in a
      // portal below the trigger, and only what's inside the spotlight hole is
      // clickable through the overlay — the form's box covers the open dropdown.
      selector: '[data-tour="service-form"]',
      side: 'right',
      completeOn: 'service:category-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Durata del servizio',
      content:
        'Quanto tempo occupa in agenda. È già impostata sul valore predefinito: modificala se vuoi, oppure premi "Salta".',
      selector: '[data-tour="field-service-duration"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Prezzo',
      content:
        'Quanto fai pagare il servizio. Impostalo ora oppure lascialo a zero e modificalo più tardi.',
      selector: '[data-tour="field-service-price"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Costo dei prodotti',
      content:
        'Quanto ti costano i prodotti usati per questo servizio: serve al bilancio per calcolare il guadagno reale. È facoltativo.',
      selector: '[data-tour="field-service-product_cost"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Descrizione',
      content:
        'Una nota facoltativa sul servizio, per esempio cosa include. Scrivila oppure premi "Salta".',
      selector: '[data-tour="field-service-description"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva il servizio',
      content: 'Tutto pronto. Clicca "Aggiungi" per salvare il servizio nel listino.',
      selector: '[data-tour="save-service"]',
      side: 'top',
      completeOn: 'service:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Ritrova il servizio',
      content:
        'Il nuovo servizio è ora nel listino. Per ritrovarlo, scrivi il suo nome qui nella ricerca, poi clicca Avanti.',
      selector: 'input[placeholder="Cerca servizio..."]',
      side: 'bottom',
      advanceWhenFilled: 'input[placeholder="Cerca servizio..."]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Ecco il tuo listino',
      content:
        'Eccolo! Ogni servizio che aggiungi è pronto da inserire nelle fiche e contribuisce al tuo bilancio. Da qui puoi modificarlo, archiviarlo o crearne altri.',
      selector: '[data-tour="servizi-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Create-a-product task tour. Same locked-overlay create-flow shape as
 * `crea-cliente`, adapted to the Magazzino page (products live in its "Prodotti"
 * tab) and to a form whose only required fields are nome and prezzo. The marca,
 * categoria and fornitore fields are custom `Select`s whose dropdowns portal at
 * `z-popover` (below the tour overlay), so — like `crea-servizio`'s categoria —
 * each optional Select step spotlights the WHOLE form (`[data-tour="product-form"]`)
 * so the open dropdown sits inside the spotlight hole and stays clickable. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Magazzino page (spotlight the page).
 *  2. ACTION  — open the modal (advance on `product:modal-open`).
 *  3. ACTION  — write the nome; `advanceWhenFilled` gates "Avanti".
 *  4. ACTION  — write the prezzo acquisto; `advanceWhenFilled` gates on the inner
 *     `<input>` of the NumberInput (the wrapper carries the anchor, but TourCard
 *     polls the real input's value).
 *  5-7. ACTION (optional) — marca, categoria, fornitore: each spotlights the whole
 *       form so its Select dropdown is reachable; skippable via "Salta".
 *  8. ACTION (optional) — rivendita: the toggle that reveals the sell price.
 *  9. ACTION  — save (advance on `product:created`).
 * 10. ACTION  — search for the just-created product (gated on the search field).
 * 11. NARRATE — wrap up over the whole page (spotlight the page).
 */
const creaProdottoTour: LumeTour = {
  tour: 'crea-prodotto',
  endRoute: '/admin/aiuto/crea-prodotto',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Magazzino',
      content: 'Clicca su Magazzino nella barra laterale per aprire i tuoi prodotti.',
      selector: '[data-tour="nav-magazzino"]',
      side: 'right',
      advanceOnRoute: '/admin/magazzino',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Magazzino',
      content:
        'Questo è il tuo magazzino: ogni prodotto che usi o vendi vive qui, con marca, categoria, fornitore e prezzi. Aggiungiamone uno nuovo.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo Prodotto"',
      content: 'Clicca "Nuovo Prodotto" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-product-create"]',
      side: 'bottom',
      completeOn: 'product:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome',
      content:
        'Scrivi il nome del prodotto, per esempio "Siero Anticrespo", poi clicca Avanti. Nome e prezzo sono gli unici campi obbligatori.',
      selector: '[data-tour="field-product-name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-product-name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il prezzo di acquisto',
      content:
        'Inserisci quanto ti costa il prodotto, poi clicca Avanti. Serve al bilancio per calcolare il tuo guadagno.',
      selector: '[data-tour="field-product-price"]',
      side: 'top',
      advanceWhenFilled: '[data-tour="field-product-price"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Scegli la marca',
      content:
        'Apri il menù "Marca" e scegli il produttore del prodotto. È facoltativo: aiuta a filtrare e a riordinare. Compilalo oppure premi "Salta".',
      // Spotlight the whole form, not just the Select: its dropdown opens in a
      // portal below the trigger, and only what's inside the spotlight hole is
      // clickable through the overlay — the form's box covers the open dropdown.
      selector: '[data-tour="product-form"]',
      side: 'right',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Scegli la categoria',
      content:
        'Apri il menù "Categoria" e scegli il gruppo a cui appartiene il prodotto (shampoo, colore, styling…). Tiene il magazzino ordinato. Facoltativo.',
      selector: '[data-tour="product-form"]',
      side: 'right',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Scegli il fornitore',
      content:
        'Apri il menù "Fornitore" e indica da chi acquisti il prodotto. Servirà quando crei un ordine di riassortimento. Facoltativo.',
      selector: '[data-tour="product-form"]',
      side: 'right',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Prodotto da rivendita',
      content:
        'Attiva questa opzione se vendi il prodotto al cliente: comparirà il campo "Prezzo Vendita" e Lume calcolerà il margine. Lasciala spenta per i prodotti a uso interno.',
      selector: '[data-tour="field-product-retail"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva il prodotto',
      content: 'Tutto pronto. Clicca "Aggiungi" per salvare il prodotto nel magazzino.',
      selector: '[data-tour="save-product"]',
      side: 'top',
      completeOn: 'product:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Ritrova il prodotto',
      content:
        'Il nuovo prodotto è ora nel magazzino. Per ritrovarlo, scrivi il suo nome qui nella ricerca, poi clicca Avanti.',
      selector: 'input[placeholder="Cerca prodotto..."]',
      side: 'bottom',
      advanceWhenFilled: 'input[placeholder="Cerca prodotto..."]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Ecco il tuo magazzino',
      content:
        'Eccolo! Ogni prodotto che aggiungi è pronto da scaricare nelle fiche, da riordinare ai fornitori e da contare nel bilancio. Da qui puoi modificarlo, regolare la giacenza o crearne altri.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

export const lumeTours: LumeTour[] = [introTour, creaClienteTour, creaServizioTour, creaProdottoTour];

export function getTour(id: string | null | undefined): LumeTour | null {
  if (!id) return null;
  return lumeTours.find((t) => t.tour === id) ?? null;
}
