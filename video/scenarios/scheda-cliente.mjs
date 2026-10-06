const scenario = {
  tourId: 'scheda-cliente',
  title: 'La scheda cliente',
  subtitle: 'Foto, contatti, storico delle visite e note in una pagina.',

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'client:detail-open': [{ click: { role: 'button', name: 'Apri scheda di Beatrice Barbieri' } }],
  },
};

export default scenario;
