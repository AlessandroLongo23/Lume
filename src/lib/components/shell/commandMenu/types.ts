import type { LucideIcon } from 'lucide-react';
import type { useRouter } from 'next/navigation';

export type EntityType =
  | 'client'
  | 'service'
  | 'product'
  | 'fiche'
  | 'operator'
  | 'order'
  | 'coupon'
  | 'abbonamento'
  | 'service-category'
  | 'product-category';

export type EntitySummary = {
  type: EntityType;
  id: string;
  label: string;
  subtitle?: string;
  href: string;
};

export type ActionDanger = 'none' | 'confirm-inline' | 'confirm-modal';

type Router = ReturnType<typeof useRouter>;

export type CommandAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  kbd?: string;
  danger?: ActionDanger;
  perform: (router: Router) => void | Promise<void>;
  entity?: EntitySummary;
};

export type NavResult = {
  kind: 'nav';
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string[];
  group?: string;
};

export type EntityResult = {
  kind: 'entity';
  entity: EntitySummary;
  icon: LucideIcon;
  actions: CommandAction[];
};

export type ActionResult = {
  kind: 'action';
  action: CommandAction;
  group?: string;
};

export type CommandResult = NavResult | EntityResult | ActionResult;
