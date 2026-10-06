const scenario = {
  tourId: 'prenota-appuntamento',
  title: 'Prenotare un appuntamento',
  subtitle: "Da uno spazio libero del calendario a un appuntamento in agenda.",

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    // A spot in the first operator's column, clear of the tour card. The
    // recorder's clock is mid-morning, so anything lower on the grid is a free
    // slot later today.
    'fiche:modal-open': [{ point: [0.19, 0.82], in: '[data-tour="calendario-page"]' }],
    'fiche:client-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="fiche-details"]' } },
      { click: { role: 'option', name: 'Laura Giordano' } },
    ],
    'fiche:service-added': [
      { click: 'input[placeholder="Cerca e aggiungi servizi…"]' },
      { type: 'Piega' },
      { click: { text: 'Piega Mossa', in: '[data-tour="fiche-services"]' } },
    ],
  },
};

export default scenario;
