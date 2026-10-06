const scenario = {
  tourId: 'crea-operatore',
  title: 'Aggiungere un operatore',
  subtitle: 'Un nuovo membro dello staff, pronto per fiche e appuntamenti.',

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="field-operator-first_name"]': 'Elena',
    '[data-tour="field-operator-last_name"]': 'Fontana',
    'input[placeholder="Cerca operatore..."]': 'Fontana',
  },
};

export default scenario;
