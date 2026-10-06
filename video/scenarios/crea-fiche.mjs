import { inputDateTime } from '../lib/recorder.mjs';

const scenario = {
  tourId: 'crea-fiche',
  title: 'Registrare una fiche',
  subtitle: "Servizi svolti e prodotti venduti, pronti da incassare.",

  // Text typed into each field step, keyed by step selector.
  inputs: {
    // The visit just happened: the recorder's own "now".
    '[data-tour="fiche-field-datetime"]': ({ now }) => ({ fill: inputDateTime(now) }),
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'fiche:client-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="fiche-details"]' } },
      { click: { role: 'option', name: 'Marta Bianchi' } },
    ],
    'fiche:service-added': [
      { click: 'input[placeholder="Cerca e aggiungi servizi…"]' },
      { type: 'Taglio' },
      { click: { text: 'Taglio + Piega', in: '[data-tour="fiche-services"]' } },
    ],
    // The tour has no step for the operator, yet a fiche opened from "Nuova
    // fiche" cannot be saved without one. It is picked here, on the service row,
    // before moving to the products.
    'fiche:product-added': [
      { click: { css: '[role="combobox"]', in: '[data-tour="fiche-services"]' } },
      { click: { role: 'option', name: 'Giulia Bianchi' } },
      { click: { role: 'button', name: 'Prodotti', in: '[data-tour="fiche-services"]' } },
      { click: 'input[placeholder="Cerca e aggiungi prodotti…"]' },
      { type: 'Shampoo' },
      { click: { text: 'Shampoo Repair', in: '[data-tour="fiche-services"]' } },
    ],
  },
};

export default scenario;
