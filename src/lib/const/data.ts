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
  type LucideIcon,
} from 'lucide-react';

export const adminRoutes: {
  title: string;
  routes: { name: string; icon: LucideIcon; url: string }[];
}[] = [
  {
    title: 'Finanze',
    routes: [
      { name: 'Bilancio', icon: Wallet, url: 'bilancio' },
      { name: 'Statistiche', icon: ChartPie, url: 'statistiche' },
    ],
  },
  {
    title: 'Appuntamenti',
    routes: [
      { name: 'Calendario', icon: Calendar, url: 'calendario' },
      { name: 'Fiches', icon: Ticket, url: 'fiches' },
      { name: 'Clienti', icon: Users, url: 'clienti' },
      { name: 'Coupons', icon: Tag, url: 'coupons' },
      { name: 'Abbonamenti', icon: BadgePercent, url: 'abbonamenti' },
    ],
  },
  {
    title: 'Gestione e magazzino',
    routes: [
      { name: 'Servizi', icon: Scissors, url: 'servizi' },
      { name: 'Magazzino', icon: Warehouse, url: 'magazzino' },
      { name: 'Ordini', icon: ShoppingCart, url: 'ordini' },
      { name: 'Operatori', icon: UserCog, url: 'operatori' },
    ],
  },
  {
    title: 'Community',
    routes: [
      { name: 'Feedback', icon: MessageSquare, url: 'feedback' },
    ],
  },
];
