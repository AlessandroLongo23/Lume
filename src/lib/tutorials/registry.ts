import type { Tutorial } from './types';

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
