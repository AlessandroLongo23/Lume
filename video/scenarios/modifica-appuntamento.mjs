import { seedOpenFiche } from '../lib/seed.mjs';

const scenario = {
  tourId: 'modifica-appuntamento',
  title: 'Spostare, modificare o cancellare un appuntamento',
  subtitle: 'Trascinare, allungare, modificare o eliminare, tutto dal calendario.',

  // An appointment for today, so the calendar has something to open.
  seed: (ctx) => seedOpenFiche(ctx, { client: ['Elisa', 'Greco'], service: 'Piega Mossa' }),

  // Steps whose action is a choice, keyed by the tour event that completes them.
  actions: {
    'fiche:edit-open': [{ click: { text: 'Elisa Greco', in: '[data-tour="calendario-page"]' } }],
  },
};

export default scenario;
