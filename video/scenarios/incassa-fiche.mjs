import { seedOpenFiche } from '../lib/seed.mjs';

const scenario = {
  tourId: 'incassa-fiche',
  title: 'Incassare e chiudere la fiche',
  subtitle: 'Metodo di pagamento, contanti ricevuti e resto calcolato.',

  // The tour needs an open fiche to cash in; without one the app would chain
  // the whole crea-fiche tour first.
  seed: (ctx) => seedOpenFiche(ctx, { client: ['Elisa', 'Greco'], service: 'Piega Mossa' }),

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="fiche-payment-cash"]': '50',
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    // The list opens as a table; "Chiudi Fiche" is on the cards of the grid view.
    'fiche:checkout-open': [
      { click: { role: 'radio', name: 'Griglia', in: '[data-tour="fiches-page"]' } },
      { click: { role: 'button', name: 'Chiudi Fiche', in: '[data-tour="fiches-page"]' } },
    ],
    'fiche:payment-method-selected': [
      { click: { role: 'button', name: 'Contanti', in: '[data-tour="fiche-payment-methods"]' } },
    ],
  },
};

export default scenario;
