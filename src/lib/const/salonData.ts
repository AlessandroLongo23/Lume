import { Leaf, Heart, Sparkles, type LucideIcon } from 'lucide-react';

export const philosophyCards: {
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
}[] = [
  {
    icon: Leaf,
    color: 'bg-green-500',
    title: 'Prodotti Naturali',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utilizziamo solo prodotti selezionati, rispettosi dei capelli e della salute.',
  },
  {
    icon: Heart,
    color: 'bg-rose-500',
    title: 'Cura Personalizzata',
    description:
      'Sed do eiusmod tempor incididunt ut labore. Ogni cliente è unico: ascoltiamo le tue esigenze per offrirti un servizio su misura.',
  },
  {
    icon: Sparkles,
    color: 'bg-amber-500',
    title: 'Esperienza e Passione',
    description:
      'Ut enim ad minim veniam, quis nostrud exercitation. Anni di esperienza e una passione autentica per la bellezza sono la nostra forza.',
  },
];
