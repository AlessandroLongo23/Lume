const scenario = {
  tourId: 'crea-servizio',
  title: 'Aggiungere un servizio',
  subtitle: 'Una voce di listino con nome, categoria, durata e prezzo.',

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="field-service-name"]': 'Piega serale',
    'input[placeholder="Cerca servizio..."]': 'Piega serale',
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'service:category-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="service-form"]' } },
      { click: { role: 'option', name: 'Trattamenti' } },
    ],
  },
};

export default scenario;
