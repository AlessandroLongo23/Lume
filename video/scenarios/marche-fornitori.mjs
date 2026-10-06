const scenario = {
  tourId: 'marche-fornitori',
  title: 'Marche, fornitori e categorie prodotto',
  subtitle: 'Le tre anagrafiche che tengono in ordine il magazzino.',

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="field-manufacturer-name"]': 'Aurora Professional',
    '[data-tour="field-supplier-name"]': 'Forniture Bellezza Nord',
    '[data-tour="field-product-category-name"]': 'Cura della barba',
  },
};

export default scenario;
