/** Result of public.statistiche(dal, al): see supabase/migrations/2026_10_06_statistiche_function.sql. */

export type StatisticheResult = {
  dal: string;
  al: string;
  kpi: { incasso: number; fiche: number; clienti_attivi: number };
  pagamenti: { contanti: number; pos: number; altro: number };
  /** Fiches per weekday, Monday first. */
  giorni: number[];
  clienti: { id: string | null; nome: string; presenze: number; incasso: number }[];
  nuovi_abituali: { nuovi: number; abituali: number };
  servizi: { id: string | null; nome: string; categoria: string; numero: number; incasso: number }[];
  servizi_categorie: { nome: string; incasso: number; numero: number }[];
  servizi_operatori: { operatore: string; servizio: string; numero: number; incasso: number }[];
  prodotti: { id: string | null; nome: string; categoria: string; quantita: number; incasso: number }[];
  prodotti_categorie: { nome: string; incasso: number; numero: number }[];
  operatori: { id: string; nome: string; fiche: number; incasso: number; top_servizio: string; clienti: number }[];
};

/** One month of public.statistiche_andamento(): `mese` is YYYY-MM. */
export type StatisticheMese = { mese: string; incasso: number };
