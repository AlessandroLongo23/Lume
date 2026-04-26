import {
  ExternalLink,
  Pencil,
  Trash2,
  Plus,
  Receipt,
  Users,
  UserCog,
  Scissors,
  Package,
  ShoppingCart,
  Tag,
  BadgePercent,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

import type { ProfileRole } from '@/lib/auth/roles';
import { canManageSalon } from '@/lib/auth/roles';
import { dispatchCommand } from './events';
import type { CommandAction, EntitySummary, EntityType } from './types';

type StandaloneSpec = {
  id: string;
  entityType: EntityType;
  label: string;
  icon: LucideIcon;
  requiresManager?: boolean;
};

const STANDALONE_SPECS: StandaloneSpec[] = [
  { id: 'create-client',      entityType: 'client',      label: 'Crea nuovo cliente',     icon: Plus },
  { id: 'create-fiche',       entityType: 'fiche',       label: 'Nuova fiche',            icon: Receipt },
  { id: 'create-service',     entityType: 'service',     label: 'Nuovo servizio',         icon: Plus, requiresManager: true },
  { id: 'create-product',     entityType: 'product',     label: 'Nuovo prodotto',         icon: Plus, requiresManager: true },
  { id: 'create-operator',    entityType: 'operator',    label: 'Nuovo operatore',        icon: Plus, requiresManager: true },
  { id: 'create-coupon',      entityType: 'coupon',      label: 'Nuovo coupon',           icon: Plus, requiresManager: true },
  { id: 'create-abbonamento', entityType: 'abbonamento', label: 'Nuovo abbonamento',      icon: Plus, requiresManager: true },
  { id: 'create-order',       entityType: 'order',       label: 'Nuovo ordine',           icon: Plus, requiresManager: true },
];

export function buildStandaloneActions(role: ProfileRole | null): CommandAction[] {
  const isManager = canManageSalon(role);
  return STANDALONE_SPECS
    .filter((spec) => !spec.requiresManager || isManager)
    .map((spec) => ({
      id: spec.id,
      label: spec.label,
      icon: spec.icon,
      perform: () => dispatchCommand({ kind: 'open-add', entityType: spec.entityType }),
    }));
}

type EntityActionFactory = (entity: EntitySummary, role: ProfileRole | null) => CommandAction[];

const openAction = (entity: EntitySummary, label: string): CommandAction => ({
  id: `open-${entity.type}-${entity.id}`,
  label,
  icon: ExternalLink,
  perform: (router) => router.push(entity.href),
});

const editAction = (entity: EntitySummary, label: string): CommandAction => ({
  id: `edit-${entity.type}-${entity.id}`,
  label,
  icon: Pencil,
  perform: () => dispatchCommand({ kind: 'open-edit', entityType: entity.type, id: entity.id }),
  entity,
});

const deleteAction = (entity: EntitySummary, label: string): CommandAction => ({
  id: `delete-${entity.type}-${entity.id}`,
  label,
  icon: Trash2,
  danger: 'confirm-modal',
  perform: () => dispatchCommand({ kind: 'open-delete', entityType: entity.type, id: entity.id }),
  entity,
});

const clientFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri scheda cliente'),
    editAction(entity, `Modifica ${entity.label}`),
    {
      id: `new-fiche-for-${entity.id}`,
      label: `Nuova fiche per ${entity.label}`,
      icon: Receipt,
      perform: () =>
        dispatchCommand({ kind: 'open-add', entityType: 'fiche', prefill: { client_id: entity.id } }),
      entity,
    },
  ];
  if (canManageSalon(role)) actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  return actions;
};

const serviceFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri servizio'),
    editAction(entity, `Modifica ${entity.label}`),
  ];
  if (canManageSalon(role)) actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  return actions;
};

const productFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri prodotto'),
    editAction(entity, `Modifica ${entity.label}`),
  ];
  if (canManageSalon(role)) actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  return actions;
};

const ficheFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri fiche'),
    editAction(entity, 'Modifica fiche'),
  ];
  if (canManageSalon(role)) actions.push(deleteAction(entity, 'Elimina fiche'));
  return actions;
};

const operatorFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [openAction(entity, 'Apri profilo operatore')];
  if (canManageSalon(role)) {
    actions.push(editAction(entity, `Modifica ${entity.label}`));
    actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  }
  return actions;
};

const couponFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [openAction(entity, 'Apri coupon')];
  if (canManageSalon(role)) {
    actions.push(editAction(entity, 'Modifica coupon'));
    actions.push(deleteAction(entity, 'Elimina coupon'));
  }
  return actions;
};

const abbonamentoFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [openAction(entity, 'Apri abbonamento')];
  if (canManageSalon(role)) {
    actions.push(editAction(entity, 'Modifica abbonamento'));
    actions.push(deleteAction(entity, 'Elimina abbonamento'));
  }
  return actions;
};

const orderFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [openAction(entity, 'Apri ordine')];
  if (canManageSalon(role)) {
    actions.push(editAction(entity, 'Modifica ordine'));
    actions.push(deleteAction(entity, 'Elimina ordine'));
  }
  return actions;
};

const categoryFactory =
  (kind: 'servizio' | 'prodotto'): EntityActionFactory =>
  (entity) => [openAction(entity, `Apri categoria ${kind}`)];

export const entityActionFactories: Record<EntityType, EntityActionFactory> = {
  'client':           clientFactory,
  'service':          serviceFactory,
  'product':          productFactory,
  'fiche':            ficheFactory,
  'operator':         operatorFactory,
  'order':            orderFactory,
  'coupon':           couponFactory,
  'abbonamento':      abbonamentoFactory,
  'service-category': categoryFactory('servizio'),
  'product-category': categoryFactory('prodotto'),
};

export const ENTITY_ICON: Record<EntityType, LucideIcon> = {
  'client':           Users,
  'service':          Scissors,
  'product':          Package,
  'fiche':            Receipt,
  'operator':         UserCog,
  'order':            ShoppingCart,
  'coupon':           Tag,
  'abbonamento':      BadgePercent,
  'service-category': FolderOpen,
  'product-category': FolderOpen,
};
