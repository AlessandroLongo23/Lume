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
  Archive,
  CheckCircle2,
  Power,
  NotebookText,
  type LucideIcon,
} from 'lucide-react';

import type { ProfileRole } from '@/lib/auth/roles';
import { canManageSalon } from '@/lib/auth/roles';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { useFichesStore } from '@/lib/stores/fiches';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

import type { CommandAction, EntitySummary, EntityType } from './types';

// List page each entity type opens for cmd=new / ?delete=<id> / ?edit=<id> on
// list-edit entities. Detail-edit entities (cliente / servizio / prodotto)
// route through their detail href instead — see editAction below.
const ENTITY_LIST_HREF: Record<EntityType, string> = {
  'client':           '/admin/clienti',
  'service':          '/admin/servizi',
  'product':          '/admin/magazzino',
  'fiche':            '/admin/fiches',
  'operator':         '/admin/operatori',
  'order':            '/admin/ordini',
  'coupon':           '/admin/coupons',
  'abbonamento':      '/admin/abbonamenti',
  'service-category': '/admin/servizi',
  'product-category': '/admin/magazzino',
};

// Entities whose edit UI lives on the detail page (inline form). Everything
// else opens an Edit modal at the list page.
const EDIT_ON_DETAIL_PAGE = new Set<EntityType>(['client', 'service', 'product']);

function appendQuery(url: string, params: Record<string, string>): string {
  const sep = url.includes('?') ? '&' : '?';
  const q = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `${url}${sep}${q}`;
}

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
      perform: (router) => router.push(appendQuery(ENTITY_LIST_HREF[spec.entityType], { new: '1' })),
    }));
}

type EntityActionFactory = (entity: EntitySummary, role: ProfileRole | null) => CommandAction[];

const openAction = (entity: EntitySummary, label: string): CommandAction => ({
  id: `open-${entity.type}-${entity.id}`,
  label,
  icon: ExternalLink,
  perform: (router) => router.push(entity.href),
});

// Modifica X: navigates with ?edit=<id>. Detail-edit entities (cliente, servizio,
// prodotto) route through entity.href; list-edit entities (operatore, fiche,
// abbonamento, ordine) route through ENTITY_LIST_HREF, which mounts the page-level
// Edit modal preloaded with the row.
const editAction = (entity: EntitySummary, label: string): CommandAction => ({
  id: `edit-${entity.type}-${entity.id}`,
  label,
  icon: Pencil,
  perform: (router) => {
    const target = EDIT_ON_DETAIL_PAGE.has(entity.type) ? entity.href : ENTITY_LIST_HREF[entity.type];
    router.push(appendQuery(target, { edit: entity.id }));
  },
  entity,
});

const deleteAction = (entity: EntitySummary, label: string): CommandAction => ({
  id: `delete-${entity.type}-${entity.id}`,
  label,
  icon: Trash2,
  danger: 'confirm-modal',
  perform: (router) => router.push(appendQuery(ENTITY_LIST_HREF[entity.type], { delete: entity.id })),
  entity,
});

// Inline-confirm action: the palette transforms the row to a red "Conferma:"
// state on the first activation; second activation runs `run()` directly.
const inlineConfirmAction = (
  id: string,
  entity: EntitySummary,
  label: string,
  icon: LucideIcon,
  run: () => Promise<unknown>,
  successMessage: string,
  failureMessage: string,
): CommandAction => ({
  id,
  label,
  icon,
  danger: 'confirm-inline',
  entity,
  perform: async () => {
    try {
      await run();
      messagePopup.getState().success(successMessage);
    } catch {
      messagePopup.getState().error(failureMessage);
    }
  },
});

const archiveClientAction = (entity: EntitySummary): CommandAction =>
  inlineConfirmAction(
    `archive-client-${entity.id}`,
    entity,
    `Archivia ${entity.label}`,
    Archive,
    () => useClientsStore.getState().archiveClient(entity.id),
    'Cliente archiviato.',
    'Errore durante l’archiviazione.',
  );

const archiveOperatorAction = (entity: EntitySummary): CommandAction =>
  inlineConfirmAction(
    `archive-operator-${entity.id}`,
    entity,
    `Archivia ${entity.label}`,
    Archive,
    () => useOperatorsStore.getState().archiveOperator(entity.id),
    'Operatore archiviato.',
    'Errore durante l’archiviazione.',
  );

const archiveServiceAction = (entity: EntitySummary): CommandAction =>
  inlineConfirmAction(
    `archive-service-${entity.id}`,
    entity,
    `Archivia ${entity.label}`,
    Archive,
    () => useServicesStore.getState().archiveService(entity.id),
    'Servizio archiviato.',
    'Errore durante l’archiviazione.',
  );

const archiveProductAction = (entity: EntitySummary): CommandAction =>
  inlineConfirmAction(
    `archive-product-${entity.id}`,
    entity,
    `Archivia ${entity.label}`,
    Archive,
    () => useProductsStore.getState().archiveProduct(entity.id),
    'Prodotto archiviato.',
    'Errore durante l’archiviazione.',
  );

const markFicheCompletedAction = (entity: EntitySummary): CommandAction =>
  inlineConfirmAction(
    `complete-fiche-${entity.id}`,
    entity,
    'Marca come completata',
    CheckCircle2,
    () => useFichesStore.getState().updateFiche(entity.id, { status: FicheStatus.COMPLETED }),
    'Fiche completata.',
    'Errore durante l’operazione.',
  );

const toggleCouponActiveAction = (entity: EntitySummary): CommandAction => {
  const current = useCouponsStore.getState().coupons.find((c) => c.id === entity.id);
  const isActive = current?.is_active ?? true;
  return inlineConfirmAction(
    `toggle-coupon-${entity.id}`,
    entity,
    isActive ? `Disattiva ${entity.label}` : `Riattiva ${entity.label}`,
    Power,
    () => useCouponsStore.getState().updateCoupon(entity.id, { is_active: !isActive }),
    isActive ? 'Coupon disattivato.' : 'Coupon riattivato.',
    'Errore durante l’operazione.',
  );
};

const toggleAbbonamentoActiveAction = (entity: EntitySummary): CommandAction => {
  const current = useAbbonamentiStore.getState().abbonamenti.find((a) => a.id === entity.id);
  const isActive = current?.is_active ?? true;
  return inlineConfirmAction(
    `toggle-abbonamento-${entity.id}`,
    entity,
    isActive ? 'Disattiva abbonamento' : 'Riattiva abbonamento',
    Power,
    () => useAbbonamentiStore.getState().updateAbbonamento(entity.id, { is_active: !isActive }),
    isActive ? 'Abbonamento disattivato.' : 'Abbonamento riattivato.',
    'Errore durante l’operazione.',
  );
};

const clientFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri scheda cliente'),
    {
      id: `open-scheda-${entity.id}`,
      label: 'Apri scheda tecnica',
      icon: NotebookText,
      perform: (router) => router.push(`${entity.href}#scheda`),
      entity,
    },
    editAction(entity, `Modifica ${entity.label}`),
    {
      id: `new-fiche-for-${entity.id}`,
      label: `Nuova fiche per ${entity.label}`,
      icon: Receipt,
      perform: (router) =>
        router.push(appendQuery(ENTITY_LIST_HREF['fiche'], { new: '1', client: entity.id })),
      entity,
    },
  ];
  if (canManageSalon(role)) {
    actions.push(archiveClientAction(entity));
    actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  }
  return actions;
};

const serviceFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri servizio'),
    editAction(entity, `Modifica ${entity.label}`),
  ];
  if (canManageSalon(role)) {
    actions.push(archiveServiceAction(entity));
    actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  }
  return actions;
};

const productFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri prodotto'),
    editAction(entity, `Modifica ${entity.label}`),
  ];
  if (canManageSalon(role)) {
    actions.push(archiveProductAction(entity));
    actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  }
  return actions;
};

const ficheFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [
    openAction(entity, 'Apri fiche'),
    editAction(entity, 'Modifica fiche'),
  ];
  const fiche = useFichesStore.getState().fiches.find((f) => f.id === entity.id);
  if (fiche && fiche.status !== FicheStatus.COMPLETED) {
    actions.push(markFicheCompletedAction(entity));
  }
  if (canManageSalon(role)) actions.push(deleteAction(entity, 'Elimina fiche'));
  return actions;
};

const operatorFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [openAction(entity, 'Apri profilo operatore')];
  if (canManageSalon(role)) {
    actions.push(editAction(entity, `Modifica ${entity.label}`));
    actions.push(archiveOperatorAction(entity));
    actions.push(deleteAction(entity, `Elimina ${entity.label}`));
  }
  return actions;
};

const couponFactory: EntityActionFactory = (entity, role) => {
  // Coupons are immutable once created (only enable/disable/delete) — no edit modal exists.
  const actions: CommandAction[] = [openAction(entity, 'Apri coupon')];
  if (canManageSalon(role)) {
    actions.push(toggleCouponActiveAction(entity));
    actions.push(deleteAction(entity, 'Elimina coupon'));
  }
  return actions;
};

const abbonamentoFactory: EntityActionFactory = (entity, role) => {
  const actions: CommandAction[] = [openAction(entity, 'Apri abbonamento')];
  if (canManageSalon(role)) {
    actions.push(editAction(entity, 'Modifica abbonamento'));
    actions.push(toggleAbbonamentoActiveAction(entity));
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
