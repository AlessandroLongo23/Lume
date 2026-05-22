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

export const lumeTours: LumeTour[] = [
  introTour,
  creaClienteTour,
  creaServizioTour,
  creaProdottoTour,
  creaCategoriaServizioTour,
  creaOperatoreTour,
  usareCalendarioTour,
  prenotaAppuntamentoTour,
];

export function getTour(id: string | null | undefined): LumeTour | null {
  if (!id) return null;
  return lumeTours.find((t) => t.tour === id) ?? null;
}
