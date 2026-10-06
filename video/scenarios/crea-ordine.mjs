const scenario = {
  tourId: 'crea-ordine',
  title: 'Creare un ordine a un fornitore',
  subtitle: "Fornitore, data e stato: l'ordine è registrato e si segue fino alla consegna.",

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="field-order-datetime"]': { fill: '2026-10-15T09:30' },
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'order:supplier-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="order-form"]' } },
      { click: { role: 'option', nth: 0 } },
    ],
  },
};

export default scenario;
