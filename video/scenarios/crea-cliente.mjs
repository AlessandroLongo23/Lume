// Video scenario for the `crea-cliente` tour. The recorder plays the real guide,
// so steps, copy and cards all come from the tour. This file only adds what the
// tour cannot know: what to type.

const FIRST_NAME = 'Giulia';
const LAST_NAME = 'Marchetti';

const scenario = {
  tourId: 'crea-cliente',
  title: 'Aggiungere un cliente',
  subtitle: 'Dalla lista Clienti al primo salvataggio, in meno di un minuto.',

  // Text typed into each `advanceWhenFilled` step, keyed by step selector.
  inputs: {
    '[data-tour="field-client-first_name"]': FIRST_NAME,
    '[data-tour="field-client-last_name"]': LAST_NAME,
    'input[placeholder="Cerca cliente..."]': LAST_NAME,
  },
};

export default scenario;
