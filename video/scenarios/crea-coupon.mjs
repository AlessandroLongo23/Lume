const scenario = {
  tourId: 'crea-coupon',
  title: 'Creare un coupon',
  subtitle: "Un buono sconto per un cliente, pronto da applicare in fiche.",

  // Text typed into each field step, keyed by step selector.
  inputs: {
    '[data-tour="coupon-field-discount"]': '10',
  },

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'coupon:recipient-selected': [
      { click: { css: '[role="combobox"]', in: '[data-tour="coupon-form"]' } },
      { click: { role: 'option', name: 'Laura Giordano' } },
    ],
  },
};

export default scenario;
