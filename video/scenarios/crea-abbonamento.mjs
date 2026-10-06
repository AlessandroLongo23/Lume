const scenario = {
  tourId: 'crea-abbonamento',
  title: 'Creare un abbonamento',
  subtitle: "Un pacchetto di sedute prepagato, da scalare a ogni visita.",

  // Text typed into each field step, keyed by step selector. Sedute and prezzo
  // come prefilled from the salon defaults, so they need nothing here.
  inputs: {
    'input[placeholder="Cerca per cliente..."]': 'Giordano',
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'abbonamento:client-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="abbonamento-form"]' } },
      { click: { role: 'option', name: 'Laura Giordano' } },
    ],
    'abbonamento:service-added': [
      { click: { role: 'button', name: 'Taglio + Piega', in: '[data-tour="abbonamento-form"]' } },
    ],
  },
};

export default scenario;
