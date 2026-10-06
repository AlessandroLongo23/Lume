const scenario = {
  tourId: 'crea-categoria-servizio',
  title: 'Organizzare i servizi in categorie',
  subtitle: 'Una categoria nuova per tenere ordinato il listino.',

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="field-service-category-name"]': 'Rituali spa',
    '[data-tour="field-service-category-description"]': 'Trattamenti rilassanti per cute e capelli',
    'input[placeholder="Cerca categoria..."]': 'Rituali',
  },
};

export default scenario;
