const scenario = {
  tourId: 'vendi-gift-card',
  title: 'Vendere una gift card',
  subtitle: "Acquirente, destinatario e importo: il credito si spende poi in fiche.",

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="gift-card-field-amount"]': '50',
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'gift-card:purchaser-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="gift-card-form"]', nth: 0 } },
      { click: { role: 'option', name: 'Marta Bianchi' } },
    ],
    'gift-card:recipient-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="gift-card-form"]', nth: 1 } },
      { click: { role: 'option', name: 'Elisa Greco' } },
    ],
  },
};

export default scenario;
