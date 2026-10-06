const NAME = 'Olio nutriente 100 ml';

const scenario = {
  tourId: 'crea-prodotto',
  title: 'Aggiungere un prodotto',
  subtitle: 'Nome e prezzo bastano: il prodotto è pronto per fiche e ordini.',

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="field-product-name"]': NAME,
    '[data-tour="field-product-price"]': '9',
    'input[placeholder="Cerca prodotto..."]': 'Olio nutriente',
  },
};

export default scenario;
