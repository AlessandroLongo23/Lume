import type { Tutorial } from './types';
import { hasOperators } from './prerequisites';

/**
 * Source of truth for the Help Center hub. Each entry is a learning topic; the
 * matching interactive tour (if any) lives in `./tours`. Content (video/article)
 * is filled in Phase 4 — for now entries drive the hub + interactive guides.
 */
export const tutorials: Tutorial[] = [
  {
    id: 'intro',
    slug: 'primi-passi',
    title: 'Primi passi con Lume',
    summary:
      'Una panoramica delle sezioni principali e come creare il tuo primo cliente, servizio, prodotto e appuntamento.',
    complexity: 'base',
    scopes: ['generale', 'agenda', 'clienti', 'servizi', 'prodotti'],
    tourId: 'intro',
    isIntro: true,
    welcome: {
      title: 'Benvenuto in Lume',
      body: 'Ti accompagniamo in un breve giro delle sezioni principali. Puoi uscire quando vuoi e riprendere dalla pagina Aiuto.',
    },
  },
  {
    id: 'crea-cliente',
    slug: 'crea-cliente',
    title: 'Aggiungere un cliente',
    summary:
      'Aggiungi una persona alla tua lista clienti — nome, contatti e una nota — in meno di un minuto.',
    complexity: 'base',
    scopes: ['clienti'],
    tourId: 'crea-cliente',
    articleSlug: 'crea-cliente',
  },
  {
    id: 'crea-servizio',
    slug: 'crea-servizio',
    title: 'Aggiungere un servizio',
    summary:
      'Crea una voce del tuo listino — nome, categoria, durata e prezzo — pronta da usare nelle fiche.',
    complexity: 'base',
    scopes: ['servizi'],
    tourId: 'crea-servizio',
    articleSlug: 'crea-servizio',
  },
  {
    id: 'crea-categoria-servizio',
    slug: 'crea-categoria-servizio',
    title: 'Organizzare i servizi in categorie',
    summary:
      'Crea e gestisci le categorie del listino — nome, colore e descrizione — per tenere i tuoi servizi ordinati.',
    complexity: 'base',
    scopes: ['servizi'],
    tourId: 'crea-categoria-servizio',
    articleSlug: 'crea-categoria-servizio',
  },
  {
    id: 'crea-prodotto',
    slug: 'crea-prodotto',
    title: 'Aggiungere un prodotto',
    summary:
      'Aggiungi un prodotto al magazzino — nome e prezzo, e se vuoi marca, categoria e fornitore — pronto per fiche e ordini.',
    complexity: 'base',
    scopes: ['prodotti'],
    tourId: 'crea-prodotto',
    articleSlug: 'crea-prodotto',
  },
  {
    id: 'crea-operatore',
    slug: 'crea-operatore',
    title: 'Aggiungere un operatore',
    summary:
      'Crea un membro del tuo staff — nome e cognome, e se vuoi le credenziali per accedere — pronto da assegnare a fiche e appuntamenti.',
    complexity: 'base',
    scopes: ['operatori'],
    tourId: 'crea-operatore',
    articleSlug: 'crea-operatore',
  },
  {
    id: 'usare-calendario',
    slug: 'usare-calendario',
    title: 'Muoversi nel calendario',
    summary:
      'Trova la tua strada nell\'agenda: spostati tra le date, cambia tra le viste giorno, settimana e mese, e filtra per operatore.',
    complexity: 'base',
    scopes: ['agenda'],
    tourId: 'usare-calendario',
    articleSlug: 'usare-calendario',
    prerequisites: [
      { label: 'almeno un operatore', met: hasOperators, tutorialId: 'crea-operatore' },
    ],
  },
];

export function getTutorialBySlug(slug: string): Tutorial | null {
  return tutorials.find((t) => t.slug === slug) ?? null;
}

export function getTutorialById(id: string): Tutorial | null {
  return tutorials.find((t) => t.id === id) ?? null;
}

export function getIntroTutorial(): Tutorial | null {
  return tutorials.find((t) => t.isIntro) ?? null;
}
