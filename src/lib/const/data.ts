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
      { name: 'Bilancio', icon: Wallet, url: 'bilancio', searchKeywords: ['entrate', 'uscite', 'spese', 'cassa'] },
      { name: 'Statistiche', icon: ChartPie, url: 'statistiche', searchKeywords: ['analytics', 'dati', 'report'] },
    ],
  },
  {
    title: 'Appuntamenti',
    routes: [
      { name: 'Calendario', icon: Calendar, url: 'calendario', searchKeywords: ['agenda', 'prenotazioni'] },
      { name: 'Fiches', icon: Ticket, url: 'fiches', searchKeywords: ['scontrini', 'ricevute'] },
      { name: 'Clienti', icon: Users, url: 'clienti', searchKeywords: ['clientela', 'anagrafica'] },
      { name: 'Coupons', icon: Tag, url: 'coupons', searchKeywords: ['sconti', 'promo'] },
      { name: 'Abbonamenti', icon: BadgePercent, url: 'abbonamenti', searchKeywords: ['pacchetti', 'tessere'] },
    ],
  },
  {
    title: 'Gestione e magazzino',
    routes: [
      { name: 'Servizi', icon: Scissors, url: 'servizi', searchKeywords: ['listino', 'prestazioni'] },
      { name: 'Magazzino', icon: Warehouse, url: 'magazzino', searchKeywords: ['prodotti', 'inventario', 'stock'] },
      { name: 'Ordini', icon: ShoppingCart, url: 'ordini', searchKeywords: ['fornitori', 'acquisti'] },
      { name: 'Operatori', icon: UserCog, url: 'operatori', searchKeywords: ['staff', 'dipendenti'] },
    ],
  },
  {
    title: 'Community',
    routes: [
      { name: 'Feedback', icon: MessageSquare, url: 'feedback', searchKeywords: ['commenti', 'suggerimenti'] },
      { name: 'Recensione', icon: Star, url: 'recensioni', searchKeywords: ['review', 'valutazioni'] },
    ],
  },
];

export const adminSettingsRoute: AdminRoute = {
  name: 'Impostazioni',
  icon: Settings,
  url: 'impostazioni',
  searchKeywords: ['settings', 'configurazione', 'account'],
};
