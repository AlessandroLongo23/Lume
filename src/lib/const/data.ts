import {
  Wallet,
  ChartPie,
  Calendar,
  Ticket,
  Users,
  Tag,
  BadgePercent,
  Scissors,
  ShoppingCart,
  UserCog,
  Warehouse,
  MessageSquare,
  Star,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type AdminRoute = {
  name: string;
  icon: LucideIcon;
  url: string;               // path segment under /admin
  createHref?: string;       // command-menu "Crea nuovo…" target
  searchKeywords?: string[]; // command-menu fuzzy match hints
};

export type AdminRouteGroup = {
  title: string;
  routes: AdminRoute[];
};

export const adminRoutes: AdminRouteGroup[] = [
  {
    title: 'Finanze',
    routes: [
      { name: 'Bilancio', icon: Wallet, url: 'bilancio', searchKeywords: ['entrate', 'uscite', 'spese', 'cassa', 'finanze'] },
      { name: 'Statistiche', icon: ChartPie, url: 'statistiche', searchKeywords: ['analytics', 'dati', 'report', 'grafici', 'andamento'] },
    ],
  },
  {
    title: 'Appuntamenti',
    routes: [
      { name: 'Calendario', icon: Calendar, url: 'calendario', searchKeywords: ['agenda', 'prenotazioni', 'appuntamenti'] },
      { name: 'Fiches', icon: Ticket, url: 'fiches', searchKeywords: ['fiche', 'scontrini', 'ricevute', 'incassi'] },
      { name: 'Clienti', icon: Users, url: 'clienti', searchKeywords: ['cliente', 'clientela', 'anagrafica'] },
      { name: 'Coupons', icon: Tag, url: 'coupons', searchKeywords: ['coupon', 'sconti', 'promo', 'gift', 'regalo'] },
      { name: 'Abbonamenti', icon: BadgePercent, url: 'abbonamenti', searchKeywords: ['abbonamento', 'pacchetti', 'tessere'] },
    ],
  },
  {
    title: 'Gestione e magazzino',
    routes: [
      { name: 'Servizi', icon: Scissors, url: 'servizi', searchKeywords: ['servizio', 'listino', 'prestazioni', 'trattamenti'] },
      { name: 'Magazzino', icon: Warehouse, url: 'magazzino', searchKeywords: ['prodotto', 'prodotti', 'inventario', 'stock', 'scorte'] },
      { name: 'Ordini', icon: ShoppingCart, url: 'ordini', searchKeywords: ['ordine', 'fornitori', 'acquisti'] },
      { name: 'Operatori', icon: UserCog, url: 'operatori', searchKeywords: ['operatore', 'staff', 'dipendenti', 'team'] },
    ],
  },
  {
    title: 'Community',
    routes: [
      { name: 'Feedback', icon: MessageSquare, url: 'feedback', searchKeywords: ['commenti', 'suggerimenti', 'segnalazioni'] },
      { name: 'Recensioni', icon: Star, url: 'recensioni', searchKeywords: ['recensione', 'review', 'valutazioni'] },
    ],
  },
];

export const adminSettingsRoute: AdminRoute = {
  name: 'Impostazioni',
  icon: Settings,
  url: 'impostazioni',
  searchKeywords: ['settings', 'configurazione', 'account'],
};
