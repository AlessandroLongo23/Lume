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

/**
 * Create-a-service-category task tour. Same locked-overlay create-flow shape as
 * `crea-cliente`, with one twist: service categories live in the "Categorie" TAB
 * of the Servizi page (not a top-level page), so an extra ACTION step switches
 * tabs before the create button appears (the header "Nuova Categoria" button only
 * renders while the Categorie tab is active). The tab switch advances on
 * `service-category:tab-open`, emitted from the tab button's onClick. The form's
 * three fields are all plain inputs (no custom Select), so nome gates with
 * `advanceWhenFilled` and descrizione/colore are optional. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the Servizi page and its two tabs (spotlight the page).
 *  2. ACTION  — open the Categorie tab (advance on `service-category:tab-open`).
 *  3. NARRATE — introduce the categories list (spotlight the page).
 *  4. ACTION  — open the modal (advance on `service-category:modal-open`).
 *  5. ACTION  — write the nome; `advanceWhenFilled` gates "Avanti".
 *  6. ACTION (optional) — descrizione: highlighted, editable, skippable via "Salta".
 *  7. ACTION (optional) — colore: pick a tint or skip (it has a default).
 *  8. ACTION  — save (advance on `service-category:created`).
 *  9. ACTION  — search for the just-created category (gated on the search field).
 * 10. NARRATE — wrap up over the whole page (spotlight the page).
 */
const creaCategoriaServizioTour: LumeTour = {
  tour: 'crea-categoria-servizio',
  endRoute: '/admin/aiuto/crea-categoria-servizio',
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
        'Questa pagina ha due schede: "Servizi", con tutto il listino, e "Categorie", dove raggruppi i servizi per tipo. Andiamo nelle categorie.',
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
      title: 'Apri la scheda "Categorie"',
      content: 'Clicca sulla scheda "Categorie" per vedere i gruppi del tuo listino.',
      selector: '[data-tour="tab-service-categories"]',
      side: 'bottom',
      completeOn: 'service-category:tab-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Le categorie del listino',
      content:
        'Ogni categoria raggruppa i servizi per tipo — Taglio, Colore, Piega — con il suo colore e il numero di servizi che contiene. Creiamone una nuova.',
      selector: '[data-tour="servizi-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuova Categoria"',
      content: 'Clicca "Nuova Categoria" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-service-category-create"]',
      side: 'bottom',
      completeOn: 'service-category:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome',
      content:
        'Scrivi il nome della categoria, per esempio "Permanente", poi clicca Avanti. Il nome è l\'unico campo obbligatorio.',
      selector: '[data-tour="field-service-category-name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-service-category-name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Descrizione',
      content:
        'Una nota facoltativa che spiega cosa raccoglie la categoria. Scrivila oppure premi "Salta".',
      selector: '[data-tour="field-service-category-description"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Scegli il colore',
      content:
        'Scegli una tinta dalla tavolozza: è il colore con cui la categoria appare nel listino e accanto ai servizi. Usane uno diverso per ogni gruppo, oppure premi "Salta".',
      selector: '[data-tour="field-service-category-color"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva la categoria',
      content: 'Tutto pronto. Clicca "Aggiungi" per salvare la categoria.',
      selector: '[data-tour="save-service-category"]',
      side: 'top',
      completeOn: 'service-category:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Ritrova la categoria',
      content:
        'La nuova categoria è ora nell\'elenco. Per ritrovarla, scrivi il suo nome qui nella ricerca, poi clicca Avanti.',
      selector: 'input[placeholder="Cerca categoria..."]',
      side: 'bottom',
      advanceWhenFilled: 'input[placeholder="Cerca categoria..."]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Ecco le tue categorie',
      content:
        'Eccola! Ora puoi assegnarla ai servizi: nel modulo di un servizio scegli questa categoria e il servizio ne eredita il colore. Da qui puoi modificarla o archiviarla quando vuoi.',
      selector: '[data-tour="servizi-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Create-an-operator task tour. Same locked-overlay create-flow shape as
 * `crea-cliente`, with all-plain-input fields. The operator form's only required
 * fields are nome and cognome; email and telefono are optional. Email is special:
 * filling it turns the operator into one who can log into Lume (a "Password App"
 * field with an auto-generated password appears below), while leaving it blank
 * creates a no-login operator that exists only to be assigned to fiches and
 * statistics — so the email step NARRATES that choice (mode:'action' + optional)
 * rather than gating on it. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Operatori page (spotlight the page).
 *  2. ACTION  — open the modal (advance on `operator:modal-open`).
 *  3. ACTION  — write the nome; `advanceWhenFilled` gates "Avanti".
 *  4. ACTION  — write the cognome (same gating).
 *  5. ACTION (optional) — email: explains login vs no-login + the auto password.
 *  6. ACTION (optional) — telefono: highlighted, editable, skippable via "Salta".
 *  7. ACTION  — save (advance on `operator:created`).
 *  8. ACTION  — search for the just-created operator (gated on the search field).
 *  9. NARRATE — wrap up over the whole page (spotlight the page).
 */
const creaOperatoreTour: LumeTour = {
  tour: 'crea-operatore',
  endRoute: '/admin/aiuto/crea-operatore',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri gli Operatori',
      content: 'Clicca su Operatori nella barra laterale per aprire il tuo team.',
      selector: '[data-tour="nav-operatori"]',
      side: 'right',
      advanceOnRoute: '/admin/operatori',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Operatori',
      content:
        'Questa è la sezione Operatori: qui vive il tuo team. Ogni operatore può essere assegnato a servizi e appuntamenti, anche quando non accede a Lume. Aggiungiamone uno nuovo.',
      selector: '[data-tour="operatori-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo operatore"',
      content: 'Clicca "Nuovo operatore" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-operator-create"]',
      side: 'bottom',
      completeOn: 'operator:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome',
      content:
        'Scrivi il nome dell\'operatore, poi clicca Avanti. Nome e cognome sono gli unici campi obbligatori.',
      selector: '[data-tour="field-operator-first_name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-operator-first_name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il cognome',
      content: 'Ora scrivi il cognome e clicca Avanti.',
      selector: '[data-tour="field-operator-last_name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-operator-last_name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Email e accesso a Lume',
      content:
        'L\'email è facoltativa, ma decide una cosa importante: se la inserisci comparirà una password e l\'operatore potrà accedere a Lume; se la lasci vuota l\'operatore esisterà solo per assegnargli prestazioni e statistiche. Compilala oppure premi "Salta".',
      selector: '[data-tour="field-operator-email"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Telefono',
      content:
        'Un recapito telefonico per l\'operatore, se vuoi averlo a portata di mano. È facoltativo: scrivilo oppure premi "Salta".',
      selector: '[data-tour="field-operator-phone"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva l\'operatore',
      content: 'Tutto pronto. Clicca "Aggiungi" per salvare l\'operatore nel team.',
      selector: '[data-tour="save-operator"]',
      side: 'top',
      completeOn: 'operator:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Ritrova l\'operatore',
      content:
        'Il nuovo operatore è ora nel team. Per ritrovarlo, scrivi il suo nome qui nella ricerca, poi clicca Avanti.',
      selector: 'input[placeholder="Cerca operatore..."]',
      side: 'bottom',
      advanceWhenFilled: 'input[placeholder="Cerca operatore..."]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Ecco il tuo team',
      content:
        'Eccolo! Ogni operatore che aggiungi è pronto da assegnare alle fiche e agli appuntamenti. Apri la sua scheda per impostare gli orari di lavoro, i servizi che esegue e, più tardi, le credenziali di accesso.',
      selector: '[data-tour="operatori-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Move-around-the-calendar tour. A pure "tour of a page" (no creation), so —
 * per the authoring principles — it is mostly NARRATE steps anchored to real
 * toolbar controls, after the single ACTION step that navigates to the calendar.
 * It teaches the three things the user needs to find their way around the agenda:
 * spostarsi tra le date, cambiare vista (giorno/settimana/mese), filtrare per
 * operatore. No fields, no modal, no created rows. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole calendar (spotlight the page; OMIT `side`).
 *  2. NARRATE — date navigation (frecce, calendarietto, "Torna a oggi").
 *  3. NARRATE — the Giorno/Settimana/Mese view toggle.
 *  4. NARRATE — the operator filter.
 *  5. NARRATE — wrap up over the whole page (spotlight the page; OMIT `side`).
 * Whole-page steps omit `side` so the card renders fixed-centered; the toolbar
 * steps are small targets, so an anchored `side` fits.
 */
const usareCalendarioTour: LumeTour = {
  tour: 'usare-calendario',
  endRoute: '/admin/aiuto/usare-calendario',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Calendario',
      content: 'Clicca su Calendario nella barra laterale per aprire la tua agenda.',
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
        'Questo è il calendario, il cuore di Lume: ogni appuntamento del salone vive qui. Vediamo come muoverti tra le date e le viste.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Spostarti tra le date',
      content:
        'Le frecce ti portano al giorno (o alla settimana, o al mese) precedente e successivo. Clicca sulla data al centro per aprire il calendarietto e saltare a una data precisa, o premi "Torna a oggi" per rientrare alla giornata di oggi.',
      selector: '[data-tour="calendar-date-nav"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Giorno, settimana o mese',
      content:
        'Scegli come guardare l\'agenda: "Giorno" affianca tutti gli operatori nella stessa giornata, "Settimana" segue un operatore per sette giorni, "Mese" ti dà il colpo d\'occhio sull\'intero mese.',
      selector: '[data-tour="calendar-view-toggle"]',
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Filtrare per operatore',
      content:
        'Da qui scegli quali operatori vedere in agenda: nascondi chi non ti serve per concentrarti su una persona. In vista Settimana, invece, decidi di chi vedere la settimana.',
      selector: '[data-tour="calendar-operator-filter"]',
      side: 'left',
      pointerPadding: 6,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Tutto sotto controllo',
      content:
        'Ora sai muoverti nel calendario. Da qui prenoti un nuovo appuntamento cliccando su uno spazio libero, e apri una fiche cliccando su un appuntamento già in agenda.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Book-an-appointment task tour. Unlike the "create X" tours, the appointment
 * isn't born from a header "Nuovo" button — it starts by clicking an empty slot
 * on the calendar, which opens the shared `FicheModal` in add mode (the same
 * modal used to register a fiche, but here we only fill the booking essentials:
 * orario, cliente, almeno un servizio, operatore). Two flow-specific shapes:
 *  • The "click a free slot" step spotlights the WHOLE calendar (omit `side` ⇒
 *    fixed-centered card) and advances on `fiche:modal-open` (emitted from the
 *    modal's onEnterComplete) — there's no single deterministic slot to anchor,
 *    so the hole exposes the whole grid and the user clicks any free cell.
 *  • Cliente is a custom `Select` (its dropdown portals at z-popover, below the
 *    overlay) and Servizio is an inline search-and-add (its dropdown is absolute,
 *    same z-issue). Both are only clickable inside the spotlight hole, so those
 *    steps spotlight the whole COLUMN that contains the open dropdown (the left
 *    "Dettagli" column for cliente, the right "Servizi" column for servizio) and
 *    advance on `fiche:client-selected` / `fiche:service-added` rather than
 *    `advanceWhenFilled` (which can't read a value off a Select).
 * The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the calendar as the booking starting point (whole page).
 *  2. ACTION  — click a free slot (whole page; advance on `fiche:modal-open`).
 *  3. NARRATE — the appointment card opened; the orario is pre-filled from the slot.
 *  4. ACTION  — pick the cliente (spotlight left column; advance on selection).
 *  5. ACTION  — add a servizio (spotlight right column; advance on add).
 *  6. NARRATE — the operatore, set per service row, defaults to the clicked column.
 *  7. ACTION  — save (advance on `fiche:created`).
 *  8. NARRATE — wrap up over the whole calendar (the new appointment is in agenda).
 */
const prenotaAppuntamentoTour: LumeTour = {
  tour: 'prenota-appuntamento',
  endRoute: '/admin/aiuto/prenota-appuntamento',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Calendario',
      content: 'Clicca su Calendario nella barra laterale per aprire la tua agenda.',
      selector: '[data-tour="nav-calendario"]',
      side: 'right',
      advanceOnRoute: '/admin/calendario',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Si parte dal calendario',
      content:
        'Un appuntamento nasce qui, in agenda. Ogni colonna è un operatore e ogni riga un orario: dove non c\'è nulla, lo spazio è libero. Prenotiamone uno.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Clicca su uno spazio libero',
      content:
        'Clicca su un orario libero nella colonna di un operatore: si aprirà la scheda del nuovo appuntamento, già impostata su quell\'orario e quell\'operatore.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: whole-page spotlight ⇒ fixed-centered card. The hole exposes
      // the entire grid, so the user can click any free cell to open the modal.
      completeOn: 'fiche:modal-open',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La scheda dell\'appuntamento',
      content:
        'Questa è la scheda dell\'appuntamento. La "Data e ora" è già compilata con lo spazio che hai cliccato: se hai sbagliato fascia, puoi correggerla proprio qui.',
      selector: '[data-tour="fiche-field-datetime"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il cliente',
      content:
        'Apri il menù "Cliente" e scegli per chi è l\'appuntamento. Non lo trovi? Scrivi il nome e premi "Nuovo" per crearlo al volo, senza uscire da qui.',
      // Spotlight the whole left column: the Cliente Select's dropdown opens in a
      // portal just below the trigger, and only what's inside the spotlight hole
      // is clickable through the overlay — the column's box covers the dropdown.
      selector: '[data-tour="fiche-details"]',
      side: 'right',
      completeOn: 'fiche:client-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Aggiungi un servizio',
      content:
        'Nel riquadro "Servizi", scrivi nel campo di ricerca e clicca il servizio giusto: viene aggiunto all\'appuntamento. Serve almeno un servizio per prenotare.',
      // Spotlight the whole right column: the services search dropdown is absolute,
      // below the input, so the column's box keeps it inside the spotlight hole.
      selector: '[data-tour="fiche-services"]',
      side: 'left',
      completeOn: 'fiche:service-added',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'L\'operatore',
      content:
        'Ogni servizio ha la sua riga, con l\'operatore già impostato su quello della colonna che hai cliccato. Puoi cambiarlo dal menù "Operatore" e regolare durata e prezzo, se serve.',
      selector: '[data-tour="fiche-services"]',
      side: 'left',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva l\'appuntamento',
      content: 'Tutto pronto. Clicca "Aggiungi" per mettere l\'appuntamento in agenda.',
      selector: '[data-tour="save-fiche"]',
      side: 'top',
      completeOn: 'fiche:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Appuntamento prenotato',
      content:
        'Eccolo in agenda! L\'appuntamento è ora un blocco nella colonna dell\'operatore. Quando il cliente arriva, cliccaci sopra per registrare la fiche e incassare.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Move/edit/delete-an-appointment tour. The headline operations — dragging a
 * block to reschedule and dragging its edges to resize — are free pointer
 * gestures that can't be gated like a field (and a real drag/delete would mutate
 * the demo appointment), so per the `usare-calendario` precedent they are
 * NARRATED over the whole calendar rather than forced. The one safe interaction
 * is opening an appointment: clicking a block opens `FicheModal` in edit mode,
 * which advances on `fiche:edit-open` (emitted from the modal's onEnterComplete
 * in edit mode, mirroring add mode's `fiche:modal-open`). The last two steps then
 * narrate inside that modal (edit the details; delete via "Altre azioni"); the
 * final "Fine" → `endRoute` unmounts the calendar and closes the modal. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — intro: an appointment in the agenda isn't fixed (whole page).
 *  2. NARRATE — drag a block to reschedule it (whole page).
 *  3. NARRATE — drag the top/bottom edges to change the duration (whole page).
 *  4. NARRATE — the confirm modal + optional client notify after a move (whole page).
 *  5. ACTION  — click an appointment to open it (whole page; advance on fiche:edit-open).
 *  6. NARRATE — edit the details in the open card (spotlight the details column).
 *  7. NARRATE — delete via "Altre azioni" → "Elimina fiche" (spotlight the delete control).
 * Whole-page steps OMIT `side` so the card renders fixed-centered (a `side` on a
 * full-page target overflows the viewport).
 */
const modificaAppuntamentoTour: LumeTour = {
  tour: 'modifica-appuntamento',
  endRoute: '/admin/aiuto/modifica-appuntamento',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Calendario',
      content: 'Clicca su Calendario nella barra laterale per aprire la tua agenda.',
      selector: '[data-tour="nav-calendario"]',
      side: 'right',
      advanceOnRoute: '/admin/calendario',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Un appuntamento non è fisso',
      content:
        'Un appuntamento già in agenda puoi cambiarlo quando vuoi, tutto da qui: spostarlo, allungarne o accorciarne la durata, modificarne i dettagli o eliminarlo. Vediamo come.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Spostalo trascinandolo',
      content:
        'Per spostare un appuntamento, afferra il suo blocco e trascinalo: a un altro orario nella stessa colonna, o nella colonna di un altro operatore per cambiare chi lo esegue. Trascina l\'intestazione per spostare tutto, la riga di un servizio per spostare solo quello.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Cambia la durata',
      content:
        'Per allungare o accorciare un appuntamento lavori sui suoi bordi: trascina il bordo superiore ("Sposta inizio") per cambiare l\'inizio, o quello inferiore ("Sposta fine") per cambiare la fine. La durata si aggiorna da sola.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Conferma e avvisa il cliente',
      content:
        'Dopo ogni spostamento Lume mostra la finestra "Conferma modifica appuntamento" con il riepilogo prima → dopo. Da lì puoi avvisare il cliente con "Notifica via Email" o "Apri WhatsApp", poi clicca "Conferma".',
      selector: '[data-tour="calendario-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri un appuntamento',
      content:
        'Per cambiare cliente, servizi o operatore — o per eliminarlo — clicca su un appuntamento in agenda: si apre la sua scheda.',
      selector: '[data-tour="calendario-page"]',
      // No `side`: whole-page spotlight ⇒ fixed-centered card. The hole exposes
      // the whole grid, so the user can click any appointment to open its card.
      completeOn: 'fiche:edit-open',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Modifica i dettagli',
      content:
        'Questa è la scheda "Modifica fiche". Da qui cambi il cliente, l\'orario e — nel riquadro a destra — i servizi e l\'operatore di ogni riga. Quando hai finito clicchi "Salva".',
      selector: '[data-tour="fiche-details"]',
      side: 'right',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Eliminare l\'appuntamento',
      content:
        'Se l\'appuntamento salta, eliminalo da qui: apri "Altre azioni" e scegli "Elimina fiche". Lume ti chiede conferma perché l\'operazione è irreversibile. E con questo sai gestire qualunque cambiamento in agenda.',
      selector: '[data-tour="fiche-delete"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
  ],
};

/**
 * Register-a-fiche task tour. A fiche in Lume is the receipt of a visit: the
 * services performed plus the products sold. This tour creates one from scratch
 * on the Fiches page (the "Nuova fiche" header button opens the SAME `FicheModal`
 * used by the calendar, in add mode) and focuses on the part that sets it apart
 * from `prenota-appuntamento`: adding a PRODUCT alongside the service. It stops
 * before payment — that's the next tutorial (`incassa-fiche`). The modal's
 * anchors and events already exist from the appointment tours; this tour adds the
 * product step, advancing on the new `fiche:product-added` event (emitted from
 * `addProductToList`). Three modal fields need the column-spotlight trick because
 * their dropdowns portal at `z-popover` (below the overlay) and are only clickable
 * inside the spotlight hole: cliente (left "Dettagli" column → `fiche:client-selected`),
 * servizio and prodotto (both in the right "Servizi/Prodotti" column → `fiche:service-added`
 * / `fiche:product-added`). The datetime is a plain input, so it gates with
 * `advanceWhenFilled` on the inner `<input>` (the anchor is its wrapper). Unlike the
 * "create X" tours there's no "find the new row" step: a fiche has no unique name to
 * search, so — like `prenota-appuntamento` — it wraps up with a narrate over the page.
 * The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Fiches page (spotlight the page; omit side).
 *  2. ACTION  — open "Nuova fiche" (advance on `fiche:modal-open`).
 *  3. ACTION  — fill "Data e ora" (`advanceWhenFilled` on the inner input).
 *  4. ACTION  — pick the cliente (spotlight left column; advance on selection).
 *  5. ACTION  — add a servizio (spotlight right column; advance on add).
 *  6. ACTION  — switch to Prodotti and add a prodotto (spotlight right column; advance on add).
 *  7. ACTION  — save (advance on `fiche:created`).
 *  8. NARRATE — wrap up over the whole page; point to incassare next.
 */
const creaFicheTour: LumeTour = {
  tour: 'crea-fiche',
  endRoute: '/admin/aiuto/crea-fiche',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri le Fiches',
      content: 'Clicca su Fiches nella barra laterale per aprire l\'elenco delle visite.',
      selector: '[data-tour="nav-fiches"]',
      side: 'right',
      advanceOnRoute: '/admin/fiches',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Fiches',
      content:
        'La fiche è lo scontrino di una visita: i servizi svolti, i prodotti venduti e, alla fine, l\'incasso. Registriamone una nuova.',
      selector: '[data-tour="fiches-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuova fiche"',
      content: 'Clicca "Nuova fiche" per aprire la scheda della visita.',
      selector: '[data-tour="action-fiche-create"]',
      side: 'bottom',
      completeOn: 'fiche:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli data e ora',
      content:
        'Indica quando si è svolta la visita, poi clicca Avanti. La data e ora è obbligatoria.',
      selector: '[data-tour="fiche-field-datetime"]',
      side: 'bottom',
      // The anchor is the field's wrapper (label + input); gate on the real input.
      advanceWhenFilled: '[data-tour="fiche-field-datetime"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il cliente',
      content:
        'Apri il menù "Cliente" e scegli chi è venuto. Non lo trovi? Scrivi il nome e premi "Nuovo" per crearlo al volo, senza uscire da qui.',
      // Spotlight the whole left column: the Cliente Select's dropdown opens in a
      // portal just below the trigger, and only what's inside the spotlight hole
      // is clickable through the overlay — the column's box covers the dropdown.
      selector: '[data-tour="fiche-details"]',
      side: 'right',
      completeOn: 'fiche:client-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Aggiungi un servizio',
      content:
        'Nel riquadro "Servizi", scrivi nel campo di ricerca e clicca il servizio svolto: si aggiunge alla fiche con la sua durata e il suo prezzo. Nella riga, scegli dal menù "Operatore" chi l\'ha eseguito. Aggiungi pure più di un servizio.',
      // Spotlight the whole right column: the services search dropdown is absolute,
      // below the input, so the column's box keeps it inside the spotlight hole.
      selector: '[data-tour="fiche-services"]',
      side: 'left',
      completeOn: 'fiche:service-added',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Aggiungi un prodotto',
      content:
        'Hai venduto un prodotto? Clicca la scheda "Prodotti" qui in alto, cercalo e cliccalo: si aggiunge allo scontrino. Regola la quantità con i pulsanti − e +.',
      // Same right column as the service step — it also contains the Servizi/Prodotti
      // tab switcher, so switching tab and adding a product both happen inside the hole.
      selector: '[data-tour="fiche-services"]',
      side: 'left',
      completeOn: 'fiche:product-added',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva la fiche',
      content:
        'In basso trovi il subtotale, aggiornato con servizi e prodotti. Clicca "Aggiungi" per registrare la fiche.',
      selector: '[data-tour="save-fiche"]',
      side: 'top',
      completeOn: 'fiche:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Fiche registrata',
      content:
        'Eccola nell\'elenco! La fiche raccoglie i servizi e i prodotti della visita. Il passo successivo è incassare e chiuderla: aprila di nuovo, scegli il metodo di pagamento e, se serve, calcola il resto.',
      selector: '[data-tour="fiches-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Incassa-fiche (close-a-fiche) task tour. Picks up where `crea-fiche` ends: a
 * fiche has been registered, now it must be paid and closed. The flow opens
 * the Fiches page, clicks "Chiudi Fiche" on any open fiche card (whole-page
 * spotlight, since one specific card can't be deterministically anchored — same
 * pattern as the calendar-slot click in `prenota-appuntamento`), then drives
 * the user through method + cash + confirm. Two flow-specific shapes:
 *  • "Click Chiudi Fiche on a card" spotlights the whole page; the hole exposes
 *    every open card and `fiche:checkout-open` fires when the modal opens with
 *    `initialView='payment'` (emitted from FicheModal's onEnterComplete).
 *  • The payment method picker is a row of four buttons; spotlighting it as a
 *    block (`[data-tour="fiche-payment-methods"]`) and advancing on the new
 *    `fiche:payment-method-selected` event lets the user pick any method without
 *    forcing one — though the next step narrates the Contanti view because the
 *    cash + change calculation is the headline of this tutorial.
 * The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Fiches page (spotlight the page; omit side).
 *  2. ACTION  — click "Chiudi Fiche" on any card (whole page; advance on
 *               `fiche:checkout-open`).
 *  3. ACTION  — pick a metodo di pagamento; nudges toward "Contanti" so the next
 *               step's cash/resto demo applies (advance on
 *               `fiche:payment-method-selected`).
 *  4. ACTION  — write "Soldi ricevuti" (`advanceWhenFilled` on the inner input).
 *  5. ACTION  — confirm payment (advance on `fiche:closed`, emitted from the
 *               successful close path in handlePay).
 *  6. NARRATE — wrap up over the whole Fiches page; the fiche is now "Conclusa".
 */
const incassaFicheTour: LumeTour = {
  tour: 'incassa-fiche',
  endRoute: '/admin/aiuto/incassa-fiche',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri le Fiches',
      content: 'Clicca su Fiches nella barra laterale per aprire l\'elenco delle visite.',
      selector: '[data-tour="nav-fiches"]',
      side: 'right',
      advanceOnRoute: '/admin/fiches',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Le fiche da incassare',
      content:
        'Ogni fiche non ancora pagata vive nelle schede "Prenotate" (visite future) e "Arretrate" (visite passate): hanno il pulsante "Chiudi Fiche" pronto. Incassiamone una.',
      selector: '[data-tour="fiches-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Clicca "Chiudi Fiche"',
      content:
        'Sulla fiche che vuoi incassare, clicca "Chiudi Fiche": si apre la schermata di chiusura, con lo scontrino a sinistra e il pagamento a destra.',
      selector: '[data-tour="fiches-page"]',
      // No `side`: whole-page spotlight ⇒ fixed-centered card. The hole exposes
      // every open card, so the user can click "Chiudi Fiche" on any of them.
      completeOn: 'fiche:checkout-open',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il metodo di pagamento',
      content:
        'Clicca come ha pagato il cliente: "Contanti" (con calcolo del resto), "POS", "Altro" (bonifico, assegno…) o "Misto" per dividere fra più metodi. Per imparare il resto, scegli "Contanti".',
      selector: '[data-tour="fiche-payment-methods"]',
      side: 'bottom',
      completeOn: 'fiche:payment-method-selected',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Soldi ricevuti e resto',
      content:
        'Scrivi quanto ti ha dato il cliente, poi clicca Avanti. Lume calcola subito il resto da ridargli — in verde quando l\'importo è sufficiente, in rosso quanto manca se non basta.',
      selector: '[data-tour="fiche-payment-cash"]',
      side: 'bottom',
      // NumberInput renders an inner <input>; the wrapper carries the anchor.
      advanceWhenFilled: '[data-tour="fiche-payment-cash"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Conferma pagamento',
      content: 'Tutto pronto. Clicca "Conferma pagamento" per registrare l\'incasso e chiudere la fiche.',
      selector: '[data-tour="confirm-fiche-payment"]',
      side: 'top',
      completeOn: 'fiche:closed',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Fiche conclusa',
      content:
        'Pagata! La fiche si sposta sotto "Concluse" con il badge verde, e l\'importo entra nelle entrate del Bilancio e nelle statistiche del salone.',
      selector: '[data-tour="fiches-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Tour of the client detail page (scheda-cliente). Pure narration — no creation,
 * no destructive interaction. The single ACTION is "click a row to open a card":
 * row ids are not deterministic anchors, so the step spotlights the WHOLE list
 * (omit `side`) and advances on `client:detail-open` (emitted from the detail
 * page's load effect once the client is hydrated from the store). All subsequent
 * steps NARRATE the major surfaces of the open card — hero (foto + nome +
 * contatti), Modifica button (entry point to edit contacts & upload a photo),
 * Storico fiche, Note. Whole-page narrate steps omit `side` so the card renders
 * fixed-centered (anchored placement overflows a full-page target). The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the Clienti list (whole page; omit `side`).
 *  2. ACTION  — click any client (whole list; advance on `client:detail-open`).
 *  3. NARRATE — the scheda as a whole (whole detail page; omit `side`).
 *  4. NARRATE — hero: avatar/foto, nome, etichette, email & telefono.
 *  5. NARRATE — "Modifica" to edit contatti + caricare la foto.
 *  6. NARRATE — Storico fiche.
 *  7. NARRATE — Note.
 *  8. NARRATE — wrap up over the whole detail page.
 */
const schedaClienteTour: LumeTour = {
  tour: 'scheda-cliente',
  endRoute: '/admin/aiuto/scheda-cliente',
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
        'Qui vivono tutte le persone del tuo salone. Ogni riga è una scheda: apriamone una per vedere cosa c\'è dentro.',
      selector: '[data-tour="clienti-page"]',
      // No `side`: whole-page spotlight ⇒ fixed-centered card. With a `side`,
      // NextStep tries to place the card beside a target taller than the
      // viewport and pushes it off-screen.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri la scheda di un cliente',
      content:
        'Clicca su un cliente qualsiasi della lista per aprire la sua scheda. Si apre a schermo intero, con tutte le sue informazioni.',
      selector: '[data-tour="clienti-page"]',
      // No `side`: whole-page spotlight ⇒ fixed-centered card. The hole exposes
      // the whole list, so the user can click any row to open its card.
      completeOn: 'client:detail-open',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La scheda cliente',
      content:
        'Questa è la scheda completa del cliente: in cima i suoi dati, sotto la valutazione, lo storico delle visite, la scheda tecnica, i coupon e le note. Vediamole una alla volta.',
      selector: '[data-tour="cliente-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Foto, nome e contatti',
      content:
        'L\'intestazione raccoglie le informazioni di colpo d\'occhio: avatar (foto o iniziali), nome, eventuali etichette e — sulla destra — email e telefono. Clicca sull\'icona accanto a un contatto per copiarlo negli appunti.',
      selector: '[data-tour="cliente-hero"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Modifica e carica la foto',
      content:
        'Clicca "Modifica" per cambiare nome, genere, data di nascita, aggiungere email o telefono e caricare una foto del cliente con "Carica immagine". Quando hai finito, premi Salva.',
      selector: '[data-tour="cliente-edit"]',
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Storico fiche',
      content:
        'Lo storico mostra ogni visita del cliente in ordine di data, con i servizi svolti e l\'importo. Clicca su una fiche per riaprirla.',
      selector: '[data-tour="cliente-storico"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Note',
      content:
        'In fondo c\'è il campo Note: un blocco libero dove tenere a mente preferenze, allergie o qualunque dettaglio sul cliente. Per scriverla o cambiarla, entra in Modifica e usa il campo "Note" del modulo.',
      selector: '[data-tour="cliente-note"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Tutto sul cliente',
      content:
        'Ora sai dove guardare. Da qui prenoti al cliente un nuovo appuntamento dal Calendario, o apri la Scheda tecnica (sopra le note) per ricordare colori, formule e annotazioni delle visite passate.',
      selector: '[data-tour="cliente-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Manage-online-bookings tour (gestisci-prenotazioni). A "tour of a page" like
 * `usare-calendario`: after the single ACTION step that navigates to the page, it
 * NARRATES the online-bookings inbox. The headline actions — Approva / Rifiuta —
 * are NOT forced: approving flips a fiche's status AND fires a real confirmation
 * email to the client (best-effort, via Resend), so per the `modifica-appuntamento`
 * precedent (a real drag/delete would mutate demo data) they are narrated, not
 * triggered. Crucially, pending requests are produced by clients on the public
 * booking site — no tutorial can create one — and `tourQueue.runnable()` drops a
 * queued prerequisite tutorial that has no tour, so a chain can't guarantee the
 * inbox is non-empty. Therefore every content step spotlights a STABLE anchor that
 * exists whether the inbox is full or empty: the page root (`prenotazioni-page`,
 * whole-page ⇒ omit `side` ⇒ fixed-centered card) and the tab bar
 * (`prenotazioni-tabs`). It never hard-targets a request row or the action buttons
 * (those vanish on an empty inbox / non-pending tab) — the row anatomy and the two
 * buttons are described in the narration instead. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the inbox (whole page; omit side).
 *  2. NARRATE — the three tabs + their counters (spotlight the tab bar).
 *  3. NARRATE — the anatomy of a pending request (whole page).
 *  4. NARRATE — the Approva / Rifiuta actions and what each does (whole page).
 *  5. NARRATE — wrap up: approved → Prossime + Calendario (whole page).
 */
const gestisciPrenotazioniTour: LumeTour = {
  tour: 'gestisci-prenotazioni',
  endRoute: '/admin/aiuto/gestisci-prenotazioni',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri le Prenotazioni online',
      content:
        'Clicca su Prenotazioni online nella barra laterale per aprire le richieste arrivate dal sito del salone.',
      selector: '[data-tour="nav-prenotazioni"]',
      side: 'right',
      advanceOnRoute: '/admin/prenotazioni',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Le prenotazioni online',
      content:
        'Questa è la tua casella delle prenotazioni online: ogni richiesta che un cliente invia dal sito del salone arriva qui, pronta da approvare. Vediamo come gestirle.',
      selector: '[data-tour="prenotazioni-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Da approvare, Prossime, Storico',
      content:
        'Tre schede dividono le richieste: "Da approvare" sono quelle in attesa di una tua risposta, "Prossime" gli appuntamenti già confermati e ancora da svolgere, "Storico" quelli passati e quelli rifiutati. Il numero accanto a ogni scheda dice quante ne contiene.',
      selector: '[data-tour="prenotazioni-tabs"]',
      side: 'bottom',
      pointerPadding: 6,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Una richiesta in arrivo',
      content:
        'Ogni richiesta mostra a colpo d\'occhio chi l\'ha inviata, il servizio scelto con l\'operatore richiesto e quando vorrebbe venire. Così decidi se va bene senza aprire nient\'altro.',
      selector: '[data-tour="prenotazioni-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Approva o rifiuta',
      content:
        'Su ogni richiesta in attesa hai due pulsanti: "Approva" conferma l\'appuntamento, lo mette in agenda e avvisa il cliente via email; "Rifiuta" libera lo spazio e gli manda comunque un\'email cortese. In entrambi i casi la richiesta esce dalla scheda "Da approvare".',
      selector: '[data-tour="prenotazioni-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Tutto finisce in agenda',
      content:
        'Fatto! Le richieste che approvi diventano appuntamenti veri: li ritrovi nella scheda "Prossime" e nel Calendario, come quelli che crei a mano. Quali servizi rendere prenotabili e se chiedere l\'approvazione lo decidi dalle impostazioni delle prenotazioni online.',
      selector: '[data-tour="prenotazioni-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Create-a-coupon task tour (crea-coupon). Builds a gift discount coupon on the
 * Coupons page via the "Nuovo coupon" header button → `GiftCouponModal`
 * (`kind:'gift'`). Same locked-overlay create-flow shape as `crea-cliente`, with
 * two flow-specific shapes:
 *  • "Destinatario" is a custom `Select` (its dropdown portals at z-popover, below
 *    the tour overlay), so — like `crea-servizio`'s categoria — its step spotlights
 *    the WHOLE form (`[data-tour="coupon-form"]`) so the open dropdown sits inside
 *    the spotlight hole, and advances on `coupon:recipient-selected` (emitted from
 *    the Select's onChange) rather than `advanceWhenFilled`, which can't read a
 *    value off a Select.
 *  • The modal does NOT close on save: a successful "Crea coupon" swaps the form
 *    for a success view that offers to notify the recipient (WhatsApp / email). So
 *    unlike the other create tours there's no "find the new row" step over the list
 *    — the tour ends ON that success view (`[data-tour="coupon-notify"]`), and the
 *    final "Fine" → `endRoute` unmounts the page and closes the modal.
 * The discount type defaults to "Importo fisso" (a NumberInput), so the importo
 * step gates with `advanceWhenFilled` on its inner `<input>`; the type step before
 * it just NARRATES the three choices (fisso / percentuale / omaggio). The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Coupon page + its two tabs (spotlight the page).
 *  2. ACTION  — open "Nuovo coupon" (advance on `coupon:modal-open`).
 *  3. ACTION  — pick the destinatario (spotlight the form; advance on selection).
 *  4. NARRATE — the tipo di sconto toggle (fisso / percentuale / omaggio).
 *  5. ACTION  — write the importo; `advanceWhenFilled` on the NumberInput's input.
 *  6. ACTION (optional) — validità: prefilled a one year; editable or skippable.
 *  7. ACTION (optional) — ambito: limit to services/products or leave unlimited.
 *  8. ACTION (optional) — note interne: private note, editable or skippable.
 *  9. ACTION  — save (advance on `coupon:created`).
 * 10. NARRATE — the success view: notify the recipient; ends here → endRoute.
 */
const creaCouponTour: LumeTour = {
  tour: 'crea-coupon',
  endRoute: '/admin/aiuto/crea-coupon',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri i Coupon',
      content: 'Clicca su Coupons nella barra laterale per aprire i tuoi buoni sconto.',
      selector: '[data-tour="nav-coupons"]',
      side: 'right',
      advanceOnRoute: '/admin/coupons',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Coupon',
      content:
        'Questa è la sezione Coupon e gift card. Nella scheda "Coupon regalo" prepari buoni sconto da regalare a un cliente; in "Gift card" vendi buoni prepagati. Creiamo un coupon sconto.',
      selector: '[data-tour="coupons-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo coupon"',
      content: 'Clicca "Nuovo coupon" per aprire il modulo del buono sconto.',
      selector: '[data-tour="action-coupon-create"]',
      side: 'bottom',
      completeOn: 'coupon:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il destinatario',
      content:
        'Apri il menù "Destinatario" e scegli il cliente a cui regali il coupon: il buono sarà valido solo per lui. È l\'unico dato sempre obbligatorio.',
      // Spotlight the whole form, not just the Select: its dropdown opens in a
      // portal below the trigger, and only what's inside the spotlight hole is
      // clickable through the overlay — the form's box covers the open dropdown.
      selector: '[data-tour="coupon-form"]',
      side: 'right',
      completeOn: 'coupon:recipient-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Il tipo di sconto',
      content:
        'Scegli che tipo di sconto è: "Importo fisso" toglie un valore in euro, "Percentuale" una quota del totale, "Omaggio" regala un servizio o un prodotto. Per questa guida lasciamo "Importo fisso".',
      selector: '[data-tour="coupon-field-discount"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'L\'importo dello sconto',
      content:
        'Scrivi quanto vale lo sconto — con "Importo fisso" sono euro — poi clicca Avanti. Con "Percentuale" scriveresti invece un numero da 1 a 100.',
      selector: '[data-tour="coupon-field-discount"]',
      side: 'bottom',
      // The anchor wraps the toggle + the value field; gate on the NumberInput's
      // real <input> (TourCard polls its value to enable "Avanti").
      advanceWhenFilled: '[data-tour="coupon-field-discount"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Validità del coupon',
      content:
        'Da quando a quando il coupon si può usare. Lume propone già un anno di validità: cambia le date se vuoi, oppure premi "Salta".',
      selector: '[data-tour="coupon-field-validity"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'A cosa si applica',
      content:
        'Lasciato vuoto, il coupon vale su tutto. Vuoi limitarlo? Scegli qui i servizi, i prodotti o le categorie su cui può essere usato. È facoltativo: imposta l\'ambito oppure premi "Salta".',
      selector: '[data-tour="coupon-field-scope"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Note interne',
      content:
        'Una nota privata sul coupon, per esempio il motivo del regalo. La vedi solo tu, non il cliente. Scrivila oppure premi "Salta".',
      selector: '[data-tour="coupon-field-notes"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Crea il coupon',
      content: 'Tutto pronto. Clicca "Crea coupon" per generare il buono.',
      selector: '[data-tour="save-coupon"]',
      side: 'top',
      completeOn: 'coupon:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Coupon pronto: avvisa il cliente',
      content:
        'Fatto! Il coupon è creato e ti aspetta nella lista "Coupon regalo". Da qui avvisi subito il cliente: "Invia su WhatsApp" apre la chat col messaggio già pronto, "Invia via email" glielo manda per email. Più avanti lo sconto si scala dal totale di una sua fiche.',
      selector: '[data-tour="coupon-notify"]',
      side: 'left',
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Sell-a-gift-card task tour (vendi-gift-card). Gift cards live in the "Gift card"
 * TAB of the Coupons page (the same page as gift coupons), sold via the header
 * "Vendi gift card" button → `GiftCardModal` (`kind:'gift_card'`). Same
 * locked-overlay create-flow shape as `crea-coupon`, with these flow-specific shapes:
 *  • The Coupons page lands on the "Coupon regalo" tab, so an extra ACTION step
 *    switches to the "Gift card" tab before the "Vendi gift card" button appears
 *    (advance on `gift-card:tab-open`, emitted from the tab button's onClick).
 *  • "Acquirente" and "Destinatario" are custom `Select`s (their dropdowns portal at
 *    z-popover, below the tour overlay), so — like `crea-coupon`'s destinatario —
 *    each step spotlights the WHOLE form (`[data-tour="gift-card-form"]`) so the open
 *    dropdown sits inside the spotlight hole, and advances on
 *    `gift-card:purchaser-selected` / `gift-card:recipient-selected` rather than
 *    `advanceWhenFilled` (which can't read a value off a Select). The recipient event
 *    also fires when the user ticks "L'acquirente la usa per sé" (which resolves the
 *    recipient without touching the Select), so that step never traps a self-buyer.
 *  • Like `crea-coupon`, the modal does NOT close on save: a successful "Vendi gift
 *    card" swaps the form for the shared success view (`[data-tour="coupon-notify"]`)
 *    that offers to notify the recipient (WhatsApp / email), so the tour ends there
 *    and the final "Fine" → `endRoute` unmounts the page and closes the modal.
 * The valore is a NumberInput, so its step gates with `advanceWhenFilled` on the inner
 * `<input>`; the metodo di pagamento is a ToggleButton (has a default), so it NARRATES.
 * The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Coupon page + its two tabs (spotlight the page).
 *  2. ACTION  — open the "Gift card" tab (advance on `gift-card:tab-open`).
 *  3. NARRATE — what a gift card is, vs a coupon (spotlight the page).
 *  4. ACTION  — open "Vendi gift card" (advance on `gift-card:modal-open`).
 *  5. ACTION  — pick the acquirente (spotlight the form; advance on selection).
 *  6. ACTION  — pick the destinatario / tick "usa per sé" (spotlight the form; advance).
 *  7. ACTION  — write the valore; `advanceWhenFilled` on the NumberInput's input.
 *  8. NARRATE — the metodo di pagamento toggle (how the buyer pays for the card).
 *  9. ACTION (optional) — validità: prefilled a one year; editable or skippable.
 * 10. ACTION (optional) — ambito: limit to services/products or leave unlimited.
 * 11. ACTION (optional) — note interne: private note, editable or skippable.
 * 12. ACTION  — save (advance on `gift-card:created`).
 * 13. NARRATE — the success view: notify the recipient; ends here → endRoute.
 */
const vendiGiftCardTour: LumeTour = {
  tour: 'vendi-gift-card',
  endRoute: '/admin/aiuto/vendi-gift-card',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri i Coupon',
      content: 'Clicca su Coupons nella barra laterale: le gift card vivono qui, insieme ai coupon sconto.',
      selector: '[data-tour="nav-coupons"]',
      side: 'right',
      advanceOnRoute: '/admin/coupons',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Coupon',
      content:
        'Questa pagina ha due schede: "Coupon regalo", i buoni sconto, e "Gift card", i buoni prepagati che un cliente compra e regala. Andiamo nelle gift card.',
      selector: '[data-tour="coupons-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri la scheda "Gift card"',
      content: 'Clicca sulla scheda "Gift card" per vedere e vendere i buoni prepagati.',
      selector: '[data-tour="tab-gift-card"]',
      side: 'bottom',
      completeOn: 'gift-card:tab-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Cos\'è una gift card',
      content:
        'A differenza di un coupon, la gift card è un importo prepagato: il cliente la paga oggi e chi la riceve la spende quando vuole, in una o più visite. Vendiamone una.',
      selector: '[data-tour="coupons-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Vendi gift card"',
      content: 'Clicca "Vendi gift card" per aprire il modulo della vendita.',
      selector: '[data-tour="action-gift-card-create"]',
      side: 'bottom',
      completeOn: 'gift-card:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli l\'acquirente',
      content:
        'Apri il menù "Acquirente" e scegli il cliente che compra e paga la gift card. Se non è ancora tra i tuoi clienti, aggiungilo prima dalla sezione Clienti.',
      // Spotlight the whole form, not just the Select: its dropdown opens in a
      // portal below the trigger, and only what's inside the spotlight hole is
      // clickable through the overlay — the form's box covers the open dropdown.
      selector: '[data-tour="gift-card-form"]',
      side: 'right',
      completeOn: 'gift-card:purchaser-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il destinatario',
      content:
        'Apri il menù "Destinatario" e scegli chi riceve la gift card e potrà spenderla. Se l\'acquirente la tiene per sé, spunta invece "L\'acquirente la usa per sé".',
      selector: '[data-tour="gift-card-form"]',
      side: 'right',
      completeOn: 'gift-card:recipient-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Il valore della gift card',
      content:
        'Scrivi il valore della gift card in euro — è il credito che il destinatario potrà spendere — poi clicca Avanti.',
      selector: '[data-tour="gift-card-field-amount"]',
      side: 'bottom',
      // The anchor is the field's wrapper (label + NumberInput); gate on the real
      // <input> inside it (TourCard polls its value to enable "Avanti").
      advanceWhenFilled: '[data-tour="gift-card-field-amount"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Come la paga l\'acquirente',
      content:
        'Indica come l\'acquirente salda la gift card: "Contanti", "Carta" o "Bonifico". Così la vendita resta registrata con il metodo giusto. Per questa guida lascia "Contanti".',
      selector: '[data-tour="gift-card-field-payment"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Validità della gift card',
      content:
        'Da quando a quando si può usare la gift card. Lume propone già un anno di validità: cambia le date se vuoi, oppure premi "Salta".',
      selector: '[data-tour="gift-card-field-validity"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'A cosa si applica',
      content:
        'Lasciato vuoto, il credito vale su tutto. Vuoi limitarlo? Scegli qui i servizi, i prodotti o le categorie su cui la gift card può essere spesa. È facoltativo: imposta l\'ambito oppure premi "Salta".',
      selector: '[data-tour="gift-card-field-scope"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Note interne',
      content:
        'Una nota privata sulla gift card, per esempio l\'occasione del regalo. La vedi solo tu, non il cliente. Scrivila oppure premi "Salta".',
      selector: '[data-tour="gift-card-field-notes"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Vendi la gift card',
      content: 'Tutto pronto. Clicca "Vendi gift card" per registrare la vendita ed emettere il buono.',
      selector: '[data-tour="save-gift-card"]',
      side: 'top',
      completeOn: 'gift-card:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Gift card emessa: avvisa il cliente',
      content:
        'Fatto! La gift card è emessa e ti aspetta nella lista "Gift card". Avvisa subito chi la riceve: "Invia su WhatsApp" apre la chat col messaggio già pronto, "Invia via email" glielo manda per email. Quando verrà a spendere il credito, la userai come metodo di pagamento per chiudere la sua fiche.',
      selector: '[data-tour="coupon-notify"]',
      side: 'left',
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Create-an-abbonamento task tour (crea-abbonamento). An abbonamento is a prepaid
 * package of sessions: the client pays today for a block of treatments at a
 * discounted price and redeems one per visit. Built on the Abbonamenti page via
 * the "Nuovo abbonamento" header button → `AddAbbonamentoModal`. Same locked-overlay
 * create-flow shape as `crea-cliente`, with two flow-specific shapes:
 *  • "Cliente" is a custom `Select` and "Servizi inclusi" is an inline search-list
 *    multiselect — neither exposes a value `advanceWhenFilled` can poll, and the
 *    Select's dropdown portals at z-popover (below the tour overlay). So — like
 *    `crea-coupon`'s destinatario — both steps spotlight the WHOLE form
 *    (`[data-tour="abbonamento-form"]`) so the open dropdown / the service list sit
 *    inside the spotlight hole, and advance on `abbonamento:client-selected` /
 *    `abbonamento:service-added` (emitted from the Select's onChange and the
 *    multiselect's onChange) rather than `advanceWhenFilled`.
 *  • The modal CLOSES on save (unlike crea-coupon's success view), so the flow ends
 *    like the other "create X" tours: a "find the new row" step gated on the table's
 *    "Cerca per cliente..." search, then a wrap-up narrate over the page.
 * "Sedute totali" and the "Prezzo" block are NumberInputs prefilled from the salon's
 * form defaults (5 sedute, 10% sconto), so their steps gate with `advanceWhenFilled`
 * on the inner `<input>` (enabled immediately, but re-gated if the user clears it or
 * switches "Prezzo" to the empty "Totale manuale" field). The metodo di pagamento is
 * a ToggleButton with a default, so it NARRATES; validità and note are optional. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Abbonamenti page (spotlight the page; omit side).
 *  2. ACTION  — open "Nuovo abbonamento" (advance on `abbonamento:modal-open`).
 *  3. ACTION  — pick the cliente (spotlight the form; advance on selection).
 *  4. ACTION  — add the servizi inclusi (spotlight the form; advance on add).
 *  5. ACTION  — sedute totali; `advanceWhenFilled` on the NumberInput's input.
 *  6. ACTION  — prezzo (sconto % o totale manuale); `advanceWhenFilled` on the input.
 *  7. NARRATE — the metodo di pagamento toggle (how the client pays for the package).
 *  8. ACTION (optional) — validità: valido dal + scadenza facoltativa; editable or skippable.
 *  9. ACTION (optional) — note interne: private note, editable or skippable.
 * 10. ACTION  — save (advance on `abbonamento:created`).
 * 11. ACTION  — search for the just-created package by client (gated on the search field).
 * 12. NARRATE — wrap up over the whole page; how "Rimanenti" decreases per redemption.
 */
const creaAbbonamentoTour: LumeTour = {
  tour: 'crea-abbonamento',
  endRoute: '/admin/aiuto/crea-abbonamento',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri gli Abbonamenti',
      content: 'Clicca su Abbonamenti nella barra laterale per aprire i pacchetti prepagati.',
      selector: '[data-tour="nav-abbonamenti"]',
      side: 'right',
      advanceOnRoute: '/admin/abbonamenti',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Abbonamenti',
      content:
        'Questa è la sezione Abbonamenti: pacchetti di sedute prepagate per i clienti che tornano spesso. Il cliente paga oggi un blocco di trattamenti a prezzo agevolato e ne scala uno a ogni visita. Creiamone uno.',
      selector: '[data-tour="abbonamenti-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo abbonamento"',
      content: 'Clicca "Nuovo abbonamento" per aprire il modulo del pacchetto.',
      selector: '[data-tour="action-abbonamento-create"]',
      side: 'bottom',
      completeOn: 'abbonamento:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il cliente',
      content:
        'Apri il menù "Cliente" e scegli a chi vendi l\'abbonamento: il pacchetto sarà legato a lui e solo lui potrà usarne le sedute.',
      // Spotlight the whole form, not just the Select: its dropdown opens in a
      // portal below the trigger, and only what's inside the spotlight hole is
      // clickable through the overlay — the form's box covers the open dropdown.
      selector: '[data-tour="abbonamento-form"]',
      side: 'right',
      completeOn: 'abbonamento:client-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli i servizi inclusi',
      content:
        'Nel riquadro "Servizi inclusi" cerca e clicca i trattamenti che il pacchetto copre. Con un solo servizio ogni seduta vale quel trattamento; con più servizi il cliente sceglie quale usare a ogni visita. Serve almeno un servizio.',
      // Same whole-form spotlight: the services search list lives inside the form,
      // so the hole exposes it and the user can pick a service through the overlay.
      selector: '[data-tour="abbonamento-form"]',
      side: 'right',
      completeOn: 'abbonamento:service-added',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Quante sedute',
      content:
        'Scrivi quante sedute comprende il pacchetto, poi clicca Avanti. È il numero di volte che il cliente potrà usarlo prima di esaurirlo.',
      selector: '[data-tour="field-abbonamento-treatments"]',
      side: 'bottom',
      // The anchor is the field's wrapper (label + NumberInput); gate on the real
      // <input> inside it (TourCard polls its value to enable "Avanti").
      advanceWhenFilled: '[data-tour="field-abbonamento-treatments"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Il prezzo del pacchetto',
      content:
        'Decidi quanto incassi. "Sconto %" applica una percentuale al prezzo di listino e Lume calcola il totale da incassare; "Totale manuale" ti lascia scrivere l\'importo esatto. Imposta il valore, poi clicca Avanti.',
      selector: '[data-tour="field-abbonamento-pricing"]',
      side: 'bottom',
      // The anchor wraps the toggle + the value field; gate on the NumberInput's
      // real <input> (in "Totale manuale" it starts empty, re-disabling "Avanti").
      advanceWhenFilled: '[data-tour="field-abbonamento-pricing"] input',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Come paga il cliente',
      content:
        'Indica come il cliente salda il pacchetto: "Contanti", "Carta" o "Bonifico". L\'incasso entra subito nel bilancio del salone.',
      selector: '[data-tour="field-abbonamento-payment"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Da quando, fino a quando',
      content:
        'Il pacchetto vale dalla data "Valido dal". Vuoi che scada? Attiva "Scadenza" e scegli la data entro cui usarlo; lasciala spenta per un pacchetto senza scadenza. Imposta le date oppure premi "Salta".',
      selector: '[data-tour="field-abbonamento-validity"]',
      side: 'bottom',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Note',
      content:
        'Una nota privata sul pacchetto, per esempio l\'accordo preso col cliente. La vedi solo tu, non il cliente. Scrivila oppure premi "Salta".',
      selector: '[data-tour="field-abbonamento-notes"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Crea l\'abbonamento',
      content: 'Tutto pronto. Clicca "Crea abbonamento" per registrare il pacchetto e l\'incasso.',
      selector: '[data-tour="save-abbonamento"]',
      side: 'top',
      completeOn: 'abbonamento:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Ritrova l\'abbonamento',
      content:
        'Il nuovo pacchetto è ora nell\'elenco. Per ritrovarlo, scrivi il nome del cliente qui nella ricerca, poi clicca Avanti.',
      selector: 'input[placeholder="Cerca per cliente..."]',
      side: 'bottom',
      advanceWhenFilled: 'input[placeholder="Cerca per cliente..."]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Pacchetto attivo',
      content:
        'Eccolo! La colonna "Rimanenti" mostra quante sedute restano: scende di una ogni volta che, registrando una fiche per quel cliente, scegli di scalare il servizio dall\'abbonamento. Da qui puoi modificarlo o seguire il credito residuo nel tempo.',
      selector: '[data-tour="abbonamenti-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Manage-stock tour (gestione-giacenza). A feature tour of the Magazzino page, NOT
 * a create flow: it teaches the three giacenza concepts where they live — the
 * per-row Giacenza adjuster (+/−), the "Soglia Min." column with its red scorte-basse
 * alert, and the product form's "Gestione Scorte" section (initial stock + per-product
 * threshold). Like `gestisci-prenotazioni`, the table-overview steps spotlight the
 * STABLE whole-page anchor (`magazzino-page`, omit side ⇒ fixed-centered card) rather
 * than a single cell: the Giacenza / Soglia columns sit at the far right of a wide,
 * horizontally-scrolling table, so a per-cell spotlight (`stock-adjuster`) can land
 * off-screen. The +/− buttons are NOT triggered — a click writes stock to the DB, so
 * per the `modifica-appuntamento` precedent they're narrated, not forced. Turning
 * tracking on/off lives in Impostazioni → Magazzino (a nested settings page); per the
 * chosen scope it is NARRATED in the closing step, not navigated into (the article
 * covers it with a screenshot). The flow ends INSIDE the open "Nuovo Prodotto" modal
 * on its Gestione Scorte section (like `crea-coupon` ends on its success view) —
 * "Fine" → endRoute unmounts the page, discarding the empty form, so no throwaway row
 * is created. The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the Magazzino page (whole page; omit side).
 *  2. NARRATE — the Giacenza column + the +/− adjuster (whole page).
 *  3. NARRATE — the Soglia Min. column + the red scorte-basse alert (whole page).
 *  4. ACTION  — open "Nuovo Prodotto" (advance on `product:modal-open`).
 *  5. NARRATE — the Gestione Scorte section (giacenza iniziale + soglia minima); closes
 *     by pointing to Impostazioni → Magazzino to attivare il tracciamento; ends here.
 */
const gestioneGiacenzaTour: LumeTour = {
  tour: 'gestione-giacenza',
  endRoute: '/admin/aiuto/gestione-giacenza',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Magazzino',
      content: 'Clicca su Magazzino nella barra laterale per aprire i tuoi prodotti e le loro scorte.',
      selector: '[data-tour="nav-magazzino"]',
      side: 'right',
      advanceOnRoute: '/admin/magazzino',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Tieni d\'occhio le scorte',
      content:
        'Questo è il Magazzino. Con il tracciamento attivo ogni prodotto porta con sé la sua giacenza — quante unità hai — e una soglia minima che ti avvisa quando sta finendo. Vediamo come funziona.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: whole-page spotlight ⇒ fixed-centered card (never overflows).
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La giacenza, sempre aggiornata',
      content:
        'Nella colonna "Giacenza", in fondo a ogni riga, vedi le unità rimaste. I pulsanti − e + le aggiornano al volo: ogni clic toglie o aggiunge un pezzo e Lume salva da solo. Perfetto per correggere una scorta dopo un conteggio.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'L\'avviso scorte basse',
      content:
        'Accanto c\'è la "Soglia Min.": il livello sotto cui non vuoi scendere. Quando la giacenza tocca o scende sotto la soglia, il numero si tinge di rosso — un colpo d\'occhio per sapere cosa riordinare.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Imposta giacenza e soglia',
      content:
        'Giacenza e soglia si impostano su ogni prodotto. Clicca "Nuovo Prodotto" per vedere dove — vale anche quando apri e modifichi un prodotto già esistente.',
      selector: '[data-tour="action-product-create"]',
      side: 'bottom',
      completeOn: 'product:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione "Gestione Scorte"',
      content:
        'Eccola, in fondo al modulo. In "Giacenza Iniziale" scrivi le unità che hai ora; in "Soglia Minima" il livello dell\'avviso rosso. Tutto qui. Per attivare o disattivare il tracciamento e scegliere la soglia predefinita dei nuovi prodotti, vai in Impostazioni → Magazzino.',
      selector: '[data-tour="product-stock-section"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
  ],
};

/**
 * Set-up-the-product-registries tour. Unlike the single-entity "create X" tours,
 * this one walks the THREE anagrafiche that organize the Magazzino — marchi
 * (manufacturers), fornitori (suppliers) and categorie prodotto — each living in
 * its own TAB of the Magazzino page, and creates one of each. Two flow-specific
 * shapes recur three times:
 *  • A TAB step (`completeOn:'magazzino:tab-<id>'`, emitted from the tab button's
 *    onClick) switches to a registry's tab; the matching header "Nuovo …" button
 *    only renders while that tab is active, so the create step right after it can
 *    anchor on `action-<entity>-create`.
 *  • Each create is the canonical modal flow: open (`<entity>:modal-open` from the
 *    modal's onEnterComplete) → fill the required nome (`advanceWhenFilled`) →
 *    optional field (`optional:true`) → save (`<entity>:created`).
 * All three modals are plain-input forms (no Select), so nome gates with
 * `advanceWhenFilled` and the optional fields never trap the user. The flow:
 *  0. ACTION  — open the Magazzino page (advance on route).
 *  1. NARRATE — introduce the page and its three registries (whole page).
 *  2-5.   MARCHI    — open tab → open modal → nome → save.
 *  6-10.  FORNITORI — open tab → open modal → nome → optional contatti → save.
 *  11-15. CATEGORIE — open tab → open modal → nome → optional colore → save.
 * 16. NARRATE — wrap up: products can now carry marca/categoria/fornitore (whole page).
 * No `startRoute`: step 0 is itself the navigation action.
 */
const marcheFornitoriTour: LumeTour = {
  tour: 'marche-fornitori',
  endRoute: '/admin/aiuto/marche-fornitori',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri il Magazzino',
      content: 'Clicca su Magazzino nella barra laterale per aprire prodotti e anagrafiche.',
      selector: '[data-tour="nav-magazzino"]',
      side: 'right',
      advanceOnRoute: '/admin/magazzino',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Le anagrafiche del magazzino',
      content:
        'Questo è il Magazzino. Oltre ai Prodotti, ha tre anagrafiche che li tengono in ordine: i Marchi (il brand), i Fornitori (da chi li compri) e le Categorie (come li raggruppi). Prepariamole una alla volta.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    // ── MARCHI ──────────────────────────────────────────────────────────────
    {
      mode: 'action',
      icon: null,
      title: 'Apri la scheda "Marchi"',
      content:
        'Clicca sulla scheda "Marchi". Qui registri il brand dei tuoi prodotti — L\'Oréal, Wella, Davines… — così puoi raggruppare e filtrare il magazzino per produttore.',
      selector: '[data-tour="tab-magazzino-marchi"]',
      side: 'bottom',
      completeOn: 'magazzino:tab-marchi',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo Marchio"',
      content: 'Clicca "Nuovo Marchio" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-manufacturer-create"]',
      side: 'bottom',
      completeOn: 'manufacturer:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome del marchio',
      content:
        'Scrivi il nome del marchio, per esempio "Redken", poi clicca Avanti. Il nome è l\'unico campo richiesto.',
      selector: '[data-tour="field-manufacturer-name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-manufacturer-name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva il marchio',
      content: 'Clicca "Aggiungi" per salvare il marchio.',
      selector: '[data-tour="save-manufacturer"]',
      side: 'top',
      completeOn: 'manufacturer:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    // ── FORNITORI ───────────────────────────────────────────────────────────
    {
      mode: 'action',
      icon: null,
      title: 'Apri la scheda "Fornitori"',
      content:
        'Ora clicca sulla scheda "Fornitori". Qui tieni l\'elenco di chi ti rifornisce: serve per gli ordini di magazzino, dove scegli il fornitore a cui inviare la richiesta.',
      selector: '[data-tour="tab-magazzino-fornitori"]',
      side: 'bottom',
      completeOn: 'magazzino:tab-fornitori',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo Fornitore"',
      content: 'Clicca "Nuovo Fornitore" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-supplier-create"]',
      side: 'bottom',
      completeOn: 'supplier:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome del fornitore',
      content:
        'Scrivi il nome del fornitore, per esempio "Distribuzione Sud Srl", poi clicca Avanti. Il nome è l\'unico campo richiesto.',
      selector: '[data-tour="field-supplier-name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-supplier-name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Recapiti del fornitore',
      content:
        'Città, telefono ed email sono facoltativi ma tornano utili: la città per ritrovarlo, telefono ed email per contattarlo quando fai un ordine. Compilali oppure premi "Salta".',
      // Spotlight the whole form so all three contact inputs are inside the
      // spotlight hole and reachable under the click-locking overlay.
      selector: '[data-tour="supplier-form"]',
      side: 'right',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva il fornitore',
      content: 'Clicca "Aggiungi" per salvare il fornitore.',
      selector: '[data-tour="save-supplier"]',
      side: 'top',
      completeOn: 'supplier:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    // ── CATEGORIE ───────────────────────────────────────────────────────────
    {
      mode: 'action',
      icon: null,
      title: 'Apri la scheda "Categorie"',
      content:
        'Infine clicca sulla scheda "Categorie". Le categorie raggruppano i prodotti per tipo — Shampoo, Colore, Styling… — per tenere il magazzino ordinato e leggere meglio i consumi.',
      selector: '[data-tour="tab-magazzino-categorie"]',
      side: 'bottom',
      completeOn: 'magazzino:tab-categorie',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuova Categoria"',
      content: 'Clicca "Nuova Categoria" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-product-category-create"]',
      side: 'bottom',
      completeOn: 'product-category:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scrivi il nome della categoria',
      content:
        'Scrivi il nome della categoria, per esempio "Trattamenti", poi clicca Avanti. Il nome è l\'unico campo richiesto.',
      selector: '[data-tour="field-product-category-name"]',
      side: 'bottom',
      advanceWhenFilled: '[data-tour="field-product-category-name"]',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      optional: true,
      title: 'Scegli il colore',
      content:
        'Scegli una tinta: è il colore con cui la categoria appare accanto ai prodotti. Ha già un valore predefinito, quindi puoi anche premere "Salta" (anche la descrizione, qui sopra, è facoltativa).',
      selector: '[data-tour="field-product-category-color"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva la categoria',
      content: 'Clicca "Aggiungi" per salvare la categoria.',
      selector: '[data-tour="save-product-category"]',
      side: 'top',
      completeOn: 'product-category:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Magazzino in ordine',
      content:
        'Fatto! Ora, quando crei o modifichi un prodotto, puoi assegnargli marca, categoria e fornitore — così filtri il magazzino a colpo d\'occhio e, con un fornitore in elenco, sei pronto a creare un ordine di riassortimento.',
      selector: '[data-tour="magazzino-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

/**
 * Create-a-supplier-order task tour (crea-ordine). Same locked-overlay create-flow
 * shape as `crea-cliente`, on the Ordini page. An order in Lume is intentionally
 * light — it carries only a fornitore, una data/ora and uno stato (no order-line
 * items in the UI) — so the form has exactly three fields, and "ricezione merce"
 * means moving the stato to "Consegnato" once the goods arrive (narrated after the
 * save, not a separate screen). Two field-shapes drive the step design:
 *  • Fornitore is a custom `Select` whose dropdown portals at z-popover (below the
 *    tour overlay): like `crea-servizio`'s categoria, the step spotlights the WHOLE
 *    form (`[data-tour="order-form"]`, side:'right') so the open dropdown sits inside
 *    the spotlight hole, and advances on `order:supplier-selected` (emitted from the
 *    Select's onChange) — `advanceWhenFilled` can't read a value off a Select.
 *  • Data e ora is a plain `<input type="datetime-local">`, so it gates with
 *    `advanceWhenFilled` on the input itself.
 *  • Stato has a sensible default ("In attesa") and its Select dropdown would open
 *    below the last field — outside the form box, so unreachable through the overlay.
 *    It is therefore NARRATED (not an action): the user leaves it on the default and
 *    learns the lifecycle, which the post-save steps complete.
 * The flow:
 *  0. ACTION  — click the sidebar link (advance on route).
 *  1. NARRATE — introduce the whole Ordini page (spotlight the page; omit side).
 *  2. ACTION  — open the modal (advance on `order:modal-open`).
 *  3. ACTION  — pick the fornitore (spotlight the form; advance on selection).
 *  4. ACTION  — pick data e ora (`advanceWhenFilled` on the datetime input).
 *  5. NARRATE — the stato starts at "In attesa".
 *  6. ACTION  — save (advance on `order:created`).
 *  7. NARRATE — the new order is in the table with its stato (whole page).
 *  8. NARRATE — update the stato as the order progresses; "Consegnato" = merce
 *     ricevuta (whole page). Last step → endRoute.
 * No `startRoute`: step 0 is itself the navigation action.
 */
const creaOrdineTour: LumeTour = {
  tour: 'crea-ordine',
  endRoute: '/admin/aiuto/crea-ordine',
  steps: [
    {
      mode: 'action',
      icon: null,
      title: 'Apri gli Ordini',
      content: 'Clicca su Ordini nella barra laterale per aprire i tuoi ordini ai fornitori.',
      selector: '[data-tour="nav-ordini"]',
      side: 'right',
      advanceOnRoute: '/admin/ordini',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'La sezione Ordini',
      content:
        'Questa è la sezione Ordini: qui tieni traccia delle richieste di riassortimento che invii ai fornitori, ognuna con la sua data e il suo stato. Creiamone una nuova.',
      selector: '[data-tour="ordini-page"]',
      // No `side`: NextStep then renders the card fixed-centered in the viewport,
      // which never overflows. Anchored placement can't fit beside a spotlight
      // taller than the screen (the whole page) — its clamp only flips once.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Apri "Nuovo Ordine"',
      content: 'Clicca "Nuovo Ordine" per aprire il modulo di inserimento.',
      selector: '[data-tour="action-order-create"]',
      side: 'bottom',
      completeOn: 'order:modal-open',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Scegli il fornitore',
      content:
        'Apri il menù "Fornitore" e scegli a chi è destinato l\'ordine. Trovi qui i fornitori che hai registrato in Magazzino → Fornitori. È il primo dei due campi obbligatori.',
      // Spotlight the whole form, not just the Select: its dropdown opens in a
      // portal below the trigger, and only what's inside the spotlight hole is
      // clickable through the overlay — the form's box covers the open dropdown.
      selector: '[data-tour="order-form"]',
      side: 'right',
      completeOn: 'order:supplier-selected',
      pointerPadding: 10,
      pointerRadius: 12,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Imposta data e ora',
      content:
        'Scegli la data e l\'ora dell\'ordine, poi clicca Avanti. È il momento in cui invii la richiesta al fornitore — l\'altro campo obbligatorio.',
      selector: '[data-tour="field-order-datetime"]',
      side: 'top',
      advanceWhenFilled: '[data-tour="field-order-datetime"]',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Lo stato dell\'ordine',
      content:
        'Ogni ordine parte da "In attesa". Più avanti lo aggiornerai man mano che procede: "Confermato" quando il fornitore accetta, "Consegnato" quando la merce arriva, "Annullato" se salta. Per ora lascialo così.',
      selector: '[data-tour="field-order-status"]',
      side: 'top',
      pointerPadding: 8,
      pointerRadius: 10,
    },
    {
      mode: 'action',
      icon: null,
      title: 'Salva l\'ordine',
      content: 'Tutto pronto. Clicca "Aggiungi" per registrare l\'ordine.',
      selector: '[data-tour="save-order"]',
      side: 'top',
      completeOn: 'order:created',
      pointerPadding: 6,
      pointerRadius: 8,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Ecco il tuo ordine',
      content:
        'Eccolo nell\'elenco, con la sua data e lo stato "In attesa". Clicca l\'icona con la freccia per aprirne il dettaglio, oppure la matita per modificarlo.',
      selector: '[data-tour="ordini-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
    {
      mode: 'narrate',
      icon: null,
      title: 'Aggiorna lo stato e ricevi la merce',
      content:
        'Man mano che l\'ordine procede, aggiorna il suo stato dalla matita "Modifica" o dal dettaglio: portalo a "Consegnato" quando la merce arriva. Così l\'elenco riflette sempre cosa hai già ricevuto e cosa stai ancora aspettando.',
      selector: '[data-tour="ordini-page"]',
      // No `side`: see note above — whole-page spotlight ⇒ fixed-centered card.
      pointerPadding: 8,
      pointerRadius: 12,
    },
  ],
};

export const lumeTours: LumeTour[] = [
  introTour,
  creaClienteTour,
  creaServizioTour,
  creaProdottoTour,
  creaCategoriaServizioTour,
  creaOperatoreTour,
  usareCalendarioTour,
  prenotaAppuntamentoTour,
  modificaAppuntamentoTour,
  creaFicheTour,
  incassaFicheTour,
  schedaClienteTour,
  gestisciPrenotazioniTour,
  creaCouponTour,
  vendiGiftCardTour,
  creaAbbonamentoTour,
  gestioneGiacenzaTour,
  marcheFornitoriTour,
  creaOrdineTour,
];

export function getTour(id: string | null | undefined): LumeTour | null {
  if (!id) return null;
  return lumeTours.find((t) => t.tour === id) ?? null;
}
