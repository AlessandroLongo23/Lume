export interface Testimonial {
  id: string | number;
  name: string;
  role: string;
  salon: string;
  city: string | null;
  quote: string;
  stars: number;
}

export const staticTestimonialsRow1: Testimonial[] = [
  {
    id: 1,
    name: 'Francesca Moretti',
    role: 'Titolare',
    salon: 'Atelier Capelli',
    city: 'Milano',
    quote:
      'Usavamo il vecchio gestionale da 6 anni. Pensavo che cambiare sarebbe stato un incubo, invece con Lume in mezza giornata eravamo operativi. Le ragazze lo adorano.',
    stars: 5,
  },
  {
    id: 2,
    name: 'Marco Ferretti',
    role: 'Titolare',
    salon: 'Barbershop Ferretti',
    city: 'Roma',
    quote:
      'Finalmente un gestionale che non sembra uscito dal 2005. I clienti ricevono il promemoria, io vedo tutto dal telefono. Pagavo €60 al mese per un software che odiavo.',
    stars: 5,
  },
  {
    id: 3,
    name: 'Giulia Esposito',
    role: 'Responsabile',
    salon: 'Studio G Hair',
    city: 'Napoli',
    quote:
      'Il calendario è una rivoluzione. Vedo tutti gli operatori in un colpo d\'occhio, sposto appuntamenti con un drag, e la scheda cliente si apre con un clic.',
    stars: 5,
  },
  {
    id: 4,
    name: 'Alessandro Bianchi',
    role: 'Titolare',
    salon: 'Bianchi Barbers',
    city: 'Torino',
    quote:
      'Con due sedi aperte, avevo bisogno di qualcosa di chiaro per gestire tutto. Lume mi dà i numeri in tempo reale: incassi, servizi più richiesti, prodotti da riordinare.',
    stars: 5,
  },
  {
    id: 5,
    name: 'Elena Conti',
    role: 'Titolare',
    salon: 'Maison Elena',
    city: 'Bologna',
    quote:
      'Ho convinto anche le mie colleghe a provarlo. Tutte passate a Lume nel giro di un mese. La gestione del magazzino da sola vale l\'abbonamento.',
    stars: 5,
  },
];

export const staticTestimonialsRow2: Testimonial[] = [
  {
    id: 6,
    name: 'Davide Russo',
    role: 'Titolare',
    salon: 'The Blade Room',
    city: 'Firenze',
    quote:
      'Sono un barbiere, non un informatico. Mi serviva qualcosa che funzionasse e basta. Lume fa esattamente quello: apri, clicchi, fatto. Nessun manuale necessario.',
    stars: 5,
  },
  {
    id: 7,
    name: 'Sara Marchetti',
    role: 'Co-titolare',
    salon: 'Onde Salon',
    city: 'Verona',
    quote:
      'La cosa che mi ha conquistato è la scheda cliente. Ogni preferenza, ogni nota, ogni trattamento passato — tutto salvato. I clienti si sentono seguiti e tornano.',
    stars: 5,
  },
  {
    id: 8,
    name: 'Roberto Galli',
    role: 'Titolare',
    salon: 'Galli Style',
    city: 'Palermo',
    quote:
      'Prima scrivevo gli appuntamenti su un\'agenda di carta. Mia figlia mi ha fatto provare Lume e non sono più tornato alla carta. A 58 anni, se ci riesco io ci riesce chiunque.',
    stars: 5,
  },
  {
    id: 9,
    name: 'Valentina Ricci',
    role: 'Titolare',
    salon: 'VR Beauty Lab',
    city: 'Genova',
    quote:
      'L\'assistenza è incredibile. Ho scritto una sera alle 22 per un dubbio e mi hanno risposto in dieci minuti. Con il vecchio software aspettavo giorni.',
    stars: 5,
  },
  {
    id: 10,
    name: 'Luca De Santis',
    role: 'Titolare',
    salon: 'Taglio & Stile',
    city: 'Bari',
    quote:
      'I miei clienti mi chiedono come faccio a ricordarmi tutto. Il segreto è Lume: apro la scheda e so esattamente cosa hanno fatto l\'ultima volta. Fa sembrare tutto magico.',
    stars: 5,
  },
];
