import {
  Wallet,
  ChartPie,
  Calendar,
  Ticket,
  Users,
  Tag,
  Scissors,
  ShoppingCart,
  UserCog,
  type LucideIcon,
} from 'lucide-react';

// SoapDispenserDroplet is not available in lucide-react, use a similar icon
import { FlaskConical } from 'lucide-react';

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
    ],
  },
  {
    title: 'Gestione e magazzino',
    routes: [
      { name: 'Servizi', icon: Scissors, url: 'servizi' },
      { name: 'Prodotti', icon: FlaskConical, url: 'prodotti' },
      { name: 'Ordini', icon: ShoppingCart, url: 'ordini' },
      { name: 'Operatori', icon: UserCog, url: 'operatori' },
    ],
  },
];
