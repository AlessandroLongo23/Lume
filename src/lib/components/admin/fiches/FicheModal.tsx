'use client';

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { Search, Scissors, User, Clock, Euro, Trash2, FileText, Calendar, Check, Package, Pencil, ReceiptText, ArrowLeft, ArrowRight, Gift, FlaskConical, Sparkles, RotateCcw, History } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFichePaymentsStore } from '@/lib/stores/fiche_payments';
import { useClientsStore } from '@/lib/stores/clients';
import { useOperatorsStore } from '@/lib/stores/operators';
import { useServicesStore } from '@/lib/stores/services';
import { useServiceCategoriesStore } from '@/lib/stores/service_categories';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useProductsStore } from '@/lib/stores/products';
import { useProductCategoriesStore } from '@/lib/stores/product_categories';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { FicheStatus } from '@/lib/types/ficheStatus';
import { FICHE_BUCKET_LABELS, getFicheBucket } from '@/lib/types/Fiche';
import { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { FICHE_BUCKET_TONE } from './ficheBucketTone';
import { validateFicheConflicts } from '@/lib/actions/fiches';
import { callServerAction } from '@/lib/utils/serverAction';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';
import { QuickAddClientModal } from '@/lib/components/admin/clients/QuickAddClientModal';
import { Button } from '@/lib/components/shared/ui/Button';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateTimeField } from '@/lib/components/shared/ui/forms/DateTimeField';
import { Callout } from '@/lib/components/shared/ui/Callout';
import { Portal } from '@/lib/components/shared/ui/Portal';
import { FloatingPanel } from '@/lib/components/shared/ui/FloatingPanel';
import { ListBox, ListRow, ListEmpty } from '@/lib/components/shared/ui/list/ListBox';
import { useAnchoredPopover } from '@/lib/hooks/useAnchoredPopover';
import { useListNavigation } from '@/lib/hooks/useListNavigation';
import { FicheReceipt } from '@/lib/components/admin/fiches/FicheReceipt';
import {
  FichePaymentPanel,
  INITIAL_SPLITS,
  buildPayments,
  isPaymentValid,
  type PaymentView,
  type Split,
} from '@/lib/components/admin/fiches/FichePaymentPanel';
import { CouponSuggestionsPanel, type SelectedCoupon } from '@/lib/components/admin/fiches/CouponSuggestionsPanel';
import { AbbonamentoCell } from '@/lib/components/admin/fiches/AbbonamentoCell';
import { FicheHistoryTab } from '@/lib/components/admin/fiches/FicheHistoryTab';
import { ConfirmEditClosedFicheDialog } from '@/lib/components/admin/fiches/ConfirmEditClosedFicheDialog';
import { formatCurrency } from '@/lib/utils/format';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';
import { supabase } from '@/lib/supabase/client';
import { useCouponsStore } from '@/lib/stores/coupons';
import type { Fiche } from '@/lib/types/Fiche';
import type { FichePayment } from '@/lib/types/FichePayment';
import type { Operator } from '@/lib/types/Operator';
import type { Service } from '@/lib/types/Service';
import type { Product } from '@/lib/types/Product';
import type { FicheProduct } from '@/lib/types/FicheProduct';
import type { FicheServiceDraft, FicheProductDraft } from '@/lib/types/FicheDraft';
import { isRangeWithinHours, effectiveScheduleFor, type DaySchedule } from '@/lib/utils/operating-hours';
import { useSalonSettingsStore } from '@/lib/stores/salonSettings';
import { useWorkspaceStore } from '@/lib/stores/workspace';

interface FicheModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  /** Edit mode: the fiche to edit */
  fiche?: Fiche | null;
  /** Add mode: pre-selected datetime from a calendar slot */
  datetime?: Date;
  /** Add mode: pre-selected operator from a calendar slot */
  operator?: Operator | null;
  /** Add mode: pre-selected client (e.g. from "Nuova fiche per X" command) */
  clientId?: string | null;
  /** Edit mode: open the modal directly on the Pagamento tab (e.g. from the fiches grid checkout action) */
  initialView?: 'edit' | 'payment';
}

function toDatetimeLocal(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TABLE_COLS = '1fr 1.5fr 6rem 3.75rem 3.75rem 6rem 1.75rem 3.5rem 2rem';

interface CategoryGroup<T> {
  categoryId: string;
  categoryName: string;
  items: T[];
}

/** Group id for catalogue items without a category (shown as "Altro"). */
const UNCATEGORISED = 'uncategorised';

/** Thrown by persistFiche when an operator is already booked; the modal asks to confirm. */
class OperatorOverlapError extends Error {}

interface CatalogSearchProps<T> {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  groups: CategoryGroup<T>[];
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  renderLabel: (item: T) => ReactNode;
  renderTrailing: (item: T) => ReactNode;
  emptyText: string;
}

/**
 * Search box that opens the catalogue under it: categories on the left (the
 * hovered one shows its items on the right), or a flat list of matches while
 * typing. The panel floats through a portal, so the modal body never clips it.
 */
function CatalogSearch<T>({
  query,
  onQueryChange,
  placeholder,
  groups,
  onSelect,
  getKey,
  renderLabel,
  renderTrailing,
  emptyText,
}: CatalogSearchProps<T>) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const { open, show, hide, position, panelRef, side } = useAnchoredPopover(fieldRef, { panelMaxHeight: 300 });

  const searching = query.trim() !== '';
  const matches = searching ? groups.flatMap((g) => g.items) : [];

  const pick = (item: T) => {
    onSelect(item);
    hide();
  };

  const nav = useListNavigation({
    count: matches.length,
    onPick: (i) => pick(matches[i]),
    onEscape: hide,
    listRef,
    pickFirstOnEnter: true,
  });

  const activeId =
    hoveredCategoryId && groups.some((g) => g.categoryId === hoveredCategoryId)
      ? hoveredCategoryId
      : groups[0]?.categoryId;
  const activeGroup = groups.find((g) => g.categoryId === activeId);

  const itemRow = (item: T, i?: number) => (
    <ListRow
      key={getKey(item)}
      highlighted={i !== undefined && nav.active === i}
      trailing={renderTrailing(item)}
      onClick={() => pick(item)}
      onMouseEnter={i !== undefined ? () => nav.setActive(i) : undefined}
    >
      {renderLabel(item)}
    </ListRow>
  );

  return (
    <div ref={fieldRef} className="shrink-0">
      <FormInput
        type="text"
        icon={<Search className="size-4" />}
        aria-label={placeholder}
        placeholder={placeholder}
        value={query}
        aria-expanded={open}
        onChange={(e) => { onQueryChange(e.target.value); nav.setActive(-1); show(); }}
        onFocus={show}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === 'Tab') { hide(); return; }
          nav.onKeyDown(e);
        }}
      />
      <Portal>
        <AnimatePresence>
          {open && position && (
            <FloatingPanel
              ref={panelRef}
              side={side}
              style={{ position: 'fixed', left: position.left, top: position.top, bottom: position.bottom, width: position.width }}
            >
              {groups.length === 0 ? (
                <ListEmpty>{emptyText}</ListEmpty>
              ) : searching ? (
                <ListBox ref={listRef} role="listbox" className="max-h-72 overflow-y-auto">
                  {matches.map((item, i) => itemRow(item, i))}
                </ListBox>
              ) : (
                <div className="grid max-h-72" style={{ gridTemplateColumns: '1fr 2.5fr' }}>
                  <ListBox
                    role="list"
                    aria-label="Categorie"
                    className="overflow-y-auto border-r border-line"
                  >
                    {groups.map((g) => (
                      <ListRow
                        key={g.categoryId}
                        selected={g.categoryId === activeId}
                        className="cursor-default"
                        onMouseEnter={() => setHoveredCategoryId(g.categoryId)}
                        onFocus={() => setHoveredCategoryId(g.categoryId)}
                      >
                        {g.categoryName}
                      </ListRow>
                    ))}
                  </ListBox>
                  <ListBox role="list" aria-label={activeGroup?.categoryName} className="overflow-y-auto">
                    {activeGroup?.items.map((item) => itemRow(item))}
                  </ListBox>
                </div>
              )}
            </FloatingPanel>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
}

/** "Omaggio" switch on a service or product line: a ghost icon button, tinted while on. */
function GiftToggle({ active, disabled, onClick }: { active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label="Segna come omaggio"
      aria-pressed={active}
      tooltip={active ? 'Omaggio attivo (clicca per ripristinare)' : 'Segna come omaggio'}
      disabled={disabled}
      onClick={onClick}
      // ds-ignore: Omaggio toggle; the warning tint marks a free line and holds on hover, while Button pressed would paint it neutral grey
      className={active ? 'text-warning-strong bg-warning-soft hover:bg-warning-soft hover:text-warning-strong' : undefined}
    >
      <Gift />
    </Button>
  );
}

/** Count how many *other* draft rows (excluding the row at `ignoreIndex`) are currently assigning each abbonamento. */
function abbonamentoDraftCounts(
  drafts: FicheServiceDraft[],
  ignoreIndex: number,
): Record<string, number> {
  const counts: Record<string, number> = {};
  drafts.forEach((d, i) => {
    if (i === ignoreIndex) return;
    if (!d.abbonamento_id) return;
    counts[d.abbonamento_id] = (counts[d.abbonamento_id] ?? 0) + 1;
  });
  return counts;
}

export function FicheModal({ mode, isOpen, onClose, fiche, datetime, operator, clientId: clientIdProp, initialView }: FicheModalProps) {
  const addFiche = useFichesStore((s) => s.addFiche);
  const updateFiche = useFichesStore((s) => s.updateFiche);
  const deleteFiche = useFichesStore((s) => s.deleteFiche);
  const closeFiche = useFichesStore((s) => s.closeFiche);
  const applyCoupon = useCouponsStore((s) => s.applyCoupon);
  const clients = useClientsStore((s) => s.clients);
  const operators = useOperatorsStore((s) => s.operators);
  const services = useServicesStore((s) => s.services);
  const serviceCategories = useServiceCategoriesStore((s) => s.service_categories);
  const { addFicheService, updateFicheService, deleteFicheService } = useFicheServicesStore();
  const products = useProductsStore((s) => s.products);
  const productCategories = useProductCategoriesStore((s) => s.product_categories);
  const { addFicheProduct, updateFicheProduct, deleteFicheProduct } = useFicheProductsStore();
  const salonName = useSubscriptionStore((s) => s.salonName) || 'Il tuo salone';
  const salonHours = useSalonSettingsStore((s) => s.settings?.operating_hours ?? null);
  const fichePayments = useFichePaymentsStore((s) => s.fiche_payments);
  const updateFichePaymentMethod = useFichePaymentsStore((s) => s.updateFichePaymentMethod);

  const [clientId, setClientId] = useState('');
  const [datetimeStr, setDatetimeStr] = useState('');
  const [note, setNote] = useState('');
  const [miscela, setMiscela] = useState('');
  const [tecnica, setTecnica] = useState('');
  const [ficheServices, setFicheServices] = useState<FicheServiceDraft[]>([]);
  const [ficheProducts, setFicheProducts] = useState<FicheProductDraft[]>([]);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddPrefill, setQuickAddPrefill] = useState<{ firstName: string; lastName: string }>({ firstName: '', lastName: '' });
  const [svcQuery, setSvcQuery] = useState('');
  const [prodQuery, setProdQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [activeTopTab, setActiveTopTab] = useState<'edit' | 'payment' | 'history'>('edit');
  const [treatmentTab, setTreatmentTab] = useState<'new' | 'last'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'submit' | null>(null);
  // An operator is already booked in the chosen time: the save waits for the
  // user to confirm the double booking, then re-runs the same action.
  const [overlapPrompt, setOverlapPrompt] = useState<
    { message: string; action: 'submit'; reason?: string } | { message: string; action: 'pay' } | null
  >(null);

  // Confirm dialog state for editing a CONCLUSA fiche
  const [showEditConfirm, setShowEditConfirm] = useState(false);

  // Id of the registered payment whose method is being changed (CONCLUSA only)
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  // Payment state
  const [paymentView, setPaymentView] = useState<PaymentView>(FichePaymentMethod.CASH);
  const [cashGiven, setCashGiven] = useState<number | null>(null);
  const [splits, setSplits] = useState<Split[]>(INITIAL_SPLITS.map((s) => ({ ...s })));
  const [selectedCoupons, setSelectedCoupons] = useState<SelectedCoupon[]>([]);

  const lastValidBaseRef = useRef<Date | null>(null);

  // Initialise state when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && fiche) {
      setClientId(fiche.client_id);
      setDatetimeStr(toDatetimeLocal(new Date(fiche.datetime)));
      setNote(fiche.note ?? '');
      setMiscela(fiche.miscela ?? '');
      setTecnica(fiche.tecnica ?? '');
      setTotalOverride(fiche.total_override ?? null);
      setFicheServices(
        fiche
          .getFicheServices()
          // Sort chronologically: the store fetches without ORDER BY, and the
          // modal drops start_time then re-derives display times sequentially
          // from the array, so an unsorted array would both mis-render the
          // services and (on Save) clobber the persisted order.
          .slice()
          .sort(
            (a, b) =>
              new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
          )
          .map((fs) => {
            const svc = services.find((s) => s.id === fs.service_id);
            return {
              id: fs.id,
              service_id: fs.service_id,
              name: fs.name || svc?.name || 'Servizio',
              operator_id: fs.operator_id ?? '',
              // Keep each service's real position. Without this the modal would
              // re-derive times by stacking durations from fiche.datetime, hiding
              // calendar moves/gaps and overwriting them on save.
              start_time: new Date(fs.start_time),
              duration: fs.duration,
              list_price: fs.list_price,
              final_price: fs.final_price,
              abbonamento_id: fs.abbonamento_id ?? null,
            };
          }),
      );
      setFicheProducts(
        fiche.getFicheProducts().map((fp: FicheProduct) => {
          const prod = products.find((p) => p.id === fp.product_id);
          return {
            id: fp.id,
            product_id: fp.product_id,
            name: prod?.name ?? 'Prodotto',
            quantity: fp.quantity ?? 1,
            list_price: fp.list_price,
            final_price: fp.final_price,
          };
        }),
      );
    } else {
      setClientId(clientIdProp ?? '');
      setDatetimeStr(toDatetimeLocal(datetime));
      setNote('');
      setMiscela('');
      setTecnica('');
      setTotalOverride(null);
      setFicheServices([]);
      setFicheProducts([]);
    }
    lastValidBaseRef.current = null;
    setErrors({});
    setErrorMessage('');
    setSvcQuery('');
    setProdQuery('');
    setActiveTab('services');
    setActiveTopTab(initialView ?? 'edit');
    setTreatmentTab('new');
    setPaymentView(FichePaymentMethod.CASH);
    setCashGiven(null);
    setSplits(INITIAL_SPLITS.map((s) => ({ ...s })));
    setSelectedCoupons([]);
    setIsSubmitting(false);
    setPendingAction(null);
    setShowEditConfirm(false);
    setUpdatingPaymentId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fiche, mode, initialView]);

  // Salon hours come from the global store (loaded by StoreInitializer).
  // We resolve per-operator effective hours below so out-of-hours warnings
  // respect each operator's working_hours override.

  // Sync datetime when the calendar slot changes while the modal is already open (add mode only)
  useEffect(() => {
    if (mode === 'add') setDatetimeStr(toDatetimeLocal(datetime));
  }, [datetime, mode]);

  // ── Closed-fiche payment derivations ──────────────────────────────────────
  // Hoisted up here (instead of grouped with the other render-time constants
  // below) so the handlers and the Pagamento tab can share them.
  const isCompleted = fiche?.status === FicheStatus.COMPLETED;

  const existingPayments = useMemo(() => {
    if (!isCompleted || !fiche?.id) return [];
    return fichePayments
      .filter((p) => p.fiche_id === fiche.id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [fichePayments, isCompleted, fiche?.id]);

  const paidSum = useMemo(
    () => existingPayments.reduce((acc, p) => acc + p.amount, 0),
    [existingPayments],
  );
  // For closed fiches the "current total" honours an override but ignores
  // unsaved totalOverride changes — base it on the fiche.getTotal() so it
  // stays consistent with the persisted state shown on the receipt.
  const closedFicheCurrentTotal = useMemo(() => {
    if (!isCompleted || !fiche) return 0;
    return fiche.getTotal();
  }, [isCompleted, fiche]);
  const paymentDelta = closedFicheCurrentTotal - paidSum;
  const showPaymentMismatch = isCompleted && Math.abs(paymentDelta) >= 0.01;

  // ── Derived values ────────────────────────────────────────────────────────

  const baseTime = useMemo(() => {
    if (!datetimeStr) return new Date();
    const d = new Date(datetimeStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [datetimeStr]);

  // Each service holds its own absolute start_time (set on load, when added, or
  // when the appointment is moved via the Data e ora field). end_time is derived
  // from its duration. We keep ficheServices in chronological order, so the index
  // here stays aligned with the per-row mutation handlers.
  const servicesWithTimes = useMemo(
    () =>
      ficheServices.map((s) => ({
        ...s,
        start_time: s.start_time,
        end_time: addMinutes(s.start_time, s.duration),
      })),
    [ficheServices],
  );

  const totalDuration = useMemo(() => ficheServices.reduce((acc, s) => acc + s.duration, 0), [ficheServices]);
  const subtotal = useMemo(
    () =>
      ficheServices.reduce((acc, s) => acc + s.final_price, 0) +
      ficheProducts.reduce((acc, p) => acc + p.final_price, 0),
    [ficheServices, ficheProducts],
  );
  const couponsDiscount = useMemo(
    () => selectedCoupons.reduce((acc, c) => acc + c.amount, 0),
    [selectedCoupons],
  );
  const subtotalAfterCoupons = Math.max(0, subtotal - couponsDiscount);
  const effectiveTotal = totalOverride ?? subtotalAfterCoupons;
  const hasOverride =
    totalOverride !== null && Math.round(totalOverride * 100) !== Math.round(subtotalAfterCoupons * 100);

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId) ?? null, [clients, clientId]);
  const lastTreatment = useMemo(() => selectedClient?.getLastTreatment() ?? null, [selectedClient]);

  const clientOptions = clients.filter((c) => !c.isArchived).map((c) => ({ ...c, fullName: c.getFullName() }));
  const operatorOptions = operators.filter((op) => !op.isArchived).map((op) => ({ ...op, fullName: op.getFullName() }));

  const clientName = selectedClient?.getFullName() ?? 'Cliente sconosciuto';

  const groupedServices = useMemo<CategoryGroup<Service>[]>(() => {
    const q = svcQuery.toLowerCase().trim();
    const activeServices = services.filter((s) => !s.isArchived);
    const filtered = q ? activeServices.filter((s) => s.name.toLowerCase().includes(q)) : activeServices;
    const groups = new Map<string, CategoryGroup<Service>>();
    for (const svc of filtered) {
      const cat = serviceCategories.find((c) => c.id === svc.category_id);
      const catName = cat?.name ?? 'Altro';
      const key = svc.category_id ?? UNCATEGORISED;
      if (!groups.has(key)) {
        groups.set(key, { categoryId: key, categoryName: catName, items: [] });
      }
      groups.get(key)!.items.push(svc);
    }
    return Array.from(groups.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'it'));
  }, [services, serviceCategories, svcQuery]);

  const groupedProducts = useMemo<CategoryGroup<Product>[]>(() => {
    const q = prodQuery.toLowerCase().trim();
    const activeProducts = products.filter((p) => !p.isArchived);
    const filtered = q ? activeProducts.filter((p) => p.name.toLowerCase().includes(q)) : activeProducts;
    const groups = new Map<string, CategoryGroup<Product>>();
    for (const prod of filtered) {
      const cat = productCategories.find((c) => c.id === prod.product_category_id);
      const catName = cat?.name ?? 'Altro';
      const key = prod.product_category_id ?? UNCATEGORISED;
      if (!groups.has(key)) {
        groups.set(key, { categoryId: key, categoryName: catName, items: [] });
      }
      groups.get(key)!.items.push(prod);
    }
    return Array.from(groups.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'it'));
  }, [products, productCategories, prodQuery]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  function addServiceToList(svc: Service) {
    setFicheServices((prev) => {
      // The calendar draws a service in its operator's column, so a row without
      // one is invisible there. A new row takes the slot's operator when booking,
      // else the operator of the row above, else the one already on the fiche.
      const operatorId =
        (mode === 'add' ? operator?.id : undefined) ||
        prev.filter((s) => s.operator_id).at(-1)?.operator_id ||
        (mode === 'edit' ? fiche?.getFicheServices().find((fs) => fs.operator_id)?.operator_id : undefined) ||
        '';
      // New services start right after the latest existing service (contiguous),
      // or at the appointment time when this is the first one.
      const start =
        prev.length > 0
          ? new Date(Math.max(...prev.map((s) => addMinutes(s.start_time, s.duration).getTime())))
          : baseTime;
      return [
        ...prev,
        { service_id: svc.id, name: svc.name, operator_id: operatorId, start_time: start, duration: svc.duration ?? 0, list_price: svc.price, final_price: svc.price, abbonamento_id: null },
      ];
    });
    setSvcQuery('');
    // Advances the "aggiungi un servizio" step of the booking guide (no-op without a tour).
    emitTourEvent('fiche:service-added');
  }

  /** Editing "Data e ora" moves the whole appointment: every service shifts by the
   *  same delta, so gaps between services are preserved (mirrors dragging an entire
   *  appointment on the calendar). */
  function handleDatetimeChange(value: string) {
    // The move is measured from the last valid value: while the field is empty
    // or half-typed baseTime falls back to "now", and a delta taken from there
    // would throw the services to an arbitrary time.
    const current = datetimeStr ? new Date(datetimeStr) : null;
    if (current && !isNaN(current.getTime())) lastValidBaseRef.current = current;
    const prevBase = lastValidBaseRef.current ?? baseTime;
    setDatetimeStr(value);
    const next = value ? new Date(value) : null;
    if (!next || isNaN(next.getTime())) return;
    const delta = next.getTime() - prevBase.getTime();
    if (delta === 0) return;
    setFicheServices((prev) =>
      prev.map((s) => ({ ...s, start_time: new Date(s.start_time.getTime() + delta) })),
    );
  }

  function setServiceAbbonamento(index: number, abbonamentoId: string | null) {
    setFicheServices((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        if (abbonamentoId) {
          // Redeemed by abbonamento → no charge
          return { ...s, abbonamento_id: abbonamentoId, final_price: 0 };
        }
        // Removed: restore list price
        return { ...s, abbonamento_id: null, final_price: s.list_price };
      }),
    );
  }

  function removeService(index: number) {
    setFicheServices((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const oldEnd = addMinutes(target.start_time, target.duration).getTime();
      const deltaMs = target.duration * 60000;
      return prev
        .filter((_, i) => i !== index)
        // Pull the sequentially-later services up to close the freed slot,
        // keeping any gaps between the remaining services intact.
        .map((s) =>
          s.start_time.getTime() >= oldEnd
            ? { ...s, start_time: new Date(s.start_time.getTime() - deltaMs) }
            : s,
        );
    });
  }

  function updateServiceOperator(index: number, operatorId: string) {
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, operator_id: operatorId } : s)));
  }

  function updateServiceDuration(index: number, raw: number) {
    const duration = Math.max(5, raw || 5);
    setFicheServices((prev) => {
      const target = prev[index];
      if (!target) return prev;
      // Sweep forward from the edited service: push each later service only as far
      // as needed to not overlap the one before it. A gap is filled by the
      // extension first; only the overflow pushes the next service. Contiguous
      // services are pushed together. (Services are kept in chronological order.)
      let cursorMs = target.start_time.getTime() + duration * 60000;
      return prev.map((s, i) => {
        if (i === index) return { ...s, duration };
        if (i < index) return s;
        const startMs = s.start_time.getTime();
        if (startMs < cursorMs) {
          const shifted = new Date(cursorMs);
          cursorMs += s.duration * 60000;
          return { ...s, start_time: shifted };
        }
        cursorMs = startMs + s.duration * 60000;
        return s;
      });
    });
  }

  function updateServicePrice(index: number, raw: number) {
    const final_price = Math.max(0, isNaN(raw) ? 0 : raw);
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, final_price } : s)));
  }

  function updateServiceName(index: number, name: string) {
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, name } : s)));
  }

  function resetServiceName(index: number) {
    setFicheServices((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const original = services.find((cat) => cat.id === s.service_id)?.name ?? s.name;
        return { ...s, name: original };
      }),
    );
  }

  function addProductToList(prod: Product) {
    setFicheProducts((prev) => {
      if (prev.some((p) => p.product_id === prod.id)) return prev;
      // A product with no price yet goes in at 0; the line price stays editable.
      const snapPrice = prod.sell_price ?? prod.price ?? 0;
      return [...prev, { product_id: prod.id, name: prod.name, quantity: 1, list_price: snapPrice, final_price: snapPrice }];
    });
    setProdQuery('');
    // Advances the "aggiungi un prodotto" step of the registra-fiche guide (no-op without a tour).
    emitTourEvent('fiche:product-added');
  }

  // A product line's final_price is the LINE TOTAL (all pieces), exact to the cent;
  // list_price is the price of one piece. Readers never multiply final_price by quantity.
  // Changing the quantity resets the line to list price x quantity.
  function setProductQuantity(productId: string, raw: string) {
    const qty = Math.max(1, parseInt(raw, 10) || 1);
    setFicheProducts((prev) =>
      prev.map((p) => p.product_id === productId ? { ...p, quantity: qty, final_price: p.list_price * qty } : p),
    );
  }

  function setProductLineTotal(productId: string, raw: string) {
    const total = parseFloat(raw);
    setFicheProducts((prev) =>
      prev.map((p) => p.product_id === productId ? { ...p, final_price: isNaN(total) ? p.final_price : total } : p),
    );
  }

  function removeProduct(productId: string) {
    setFicheProducts((prev) => prev.filter((p) => p.product_id !== productId));
  }

  async function handleDelete() {
    if (!fiche) return;
    try {
      await deleteFiche(fiche.id);
      setShowDeleteConfirm(false);
      onClose();
      messagePopup.getState().success('Fiche eliminata con successo.');
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  }

  /** Persist all fiche fields + services + products. Returns the fiche id on success, throws on failure.
   *  `reason` is forwarded to the audit log and only consumed by the RPC when the patch
   *  contains whitelisted fiche-table fields (see `updateFiche` in the store). */
  async function persistFiche(reason?: string, allowOperatorOverlap = false): Promise<string> {
    const validation = await callServerAction(() => validateFicheConflicts(
      clientId,
      servicesWithTimes.map((svc) => ({
        operator_id: svc.operator_id,
        operator_name: operators.find((op) => op.id === svc.operator_id)?.getFullName() ?? svc.operator_id,
        start_time: svc.start_time.toISOString(),
        end_time: svc.end_time.toISOString(),
      })),
      mode === 'edit' ? fiche?.id : undefined,
      allowOperatorOverlap,
    ));
    if (validation.error) throw new Error(validation.error);
    if (validation.operatorOverlap) throw new OperatorOverlapError(validation.operatorOverlap);

    if (mode === 'add') {
      const newFiche = await addFiche({ client_id: clientId, datetime: baseTime.toISOString(), status: FicheStatus.CREATED, note, total_override: totalOverride, miscela: miscela.trim() || null, tecnica: tecnica.trim() || null });
      await Promise.all(
        servicesWithTimes.map((svc) =>
          addFicheService({
            fiche_id: newFiche.id,
            service_id: svc.service_id,
            name: svc.name,
            operator_id: svc.operator_id || undefined,
            start_time: svc.start_time.toISOString(),
            end_time: svc.end_time.toISOString(),
            duration: svc.duration,
            list_price: svc.list_price,
            final_price: svc.final_price,
            abbonamento_id: svc.abbonamento_id ?? null,
          }),
        ),
      );
      if (ficheProducts.length > 0) {
        await Promise.all(
          ficheProducts.map((prod) =>
            addFicheProduct({ fiche_id: newFiche.id, product_id: prod.product_id, quantity: prod.quantity, list_price: prod.list_price, final_price: prod.final_price }),
          ),
        );
      }
      return newFiche.id;
    }

    if (!fiche) throw new Error('Fiche mancante');
    await updateFiche(fiche.id, { client_id: clientId, datetime: baseTime.toISOString(), note, total_override: totalOverride, miscela: miscela.trim() || null, tecnica: tecnica.trim() || null }, reason);

    const currentServiceIds = new Set(ficheServices.filter((s) => s.id).map((s) => s.id!));
    for (const fs of fiche.getFicheServices()) {
      if (!currentServiceIds.has(fs.id)) await deleteFicheService(fs.id);
    }
    for (const svc of servicesWithTimes) {
      if (svc.id) {
        await updateFicheService(svc.id, {
          name: svc.name,
          operator_id: svc.operator_id || undefined,
          start_time: svc.start_time.toISOString(),
          end_time: svc.end_time.toISOString(),
          duration: svc.duration,
          list_price: svc.list_price,
          final_price: svc.final_price,
          abbonamento_id: svc.abbonamento_id ?? null,
        });
      } else {
        await addFicheService({
          fiche_id: fiche.id,
          service_id: svc.service_id,
          name: svc.name,
          operator_id: svc.operator_id || undefined,
          start_time: svc.start_time.toISOString(),
          end_time: svc.end_time.toISOString(),
          duration: svc.duration,
          list_price: svc.list_price,
          final_price: svc.final_price,
          abbonamento_id: svc.abbonamento_id ?? null,
        });
      }
    }

    const currentProductIds = new Set(ficheProducts.filter((p) => p.id).map((p) => p.id!));
    for (const fp of fiche.getFicheProducts()) {
      if (!currentProductIds.has(fp.id)) await deleteFicheProduct(fp.id);
    }
    for (const prod of ficheProducts) {
      if (prod.id) {
        await updateFicheProduct(prod.id, { quantity: prod.quantity, final_price: prod.final_price });
      } else {
        await addFicheProduct({ fiche_id: fiche.id, product_id: prod.product_id, quantity: prod.quantity, list_price: prod.list_price, final_price: prod.final_price });
      }
    }

    return fiche.id;
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};
    if (!clientId) newErrors.client_id = 'Seleziona un cliente';
    if (!datetimeStr) newErrors.datetime = 'Inserisci data e ora';
    // A shop sale with no treatment is a fiche with products only.
    if (!ficheServices.length && !ficheProducts.length) newErrors.services = 'Aggiungi almeno un servizio o un prodotto';
    else if (ficheServices.some((s) => !s.operator_id)) newErrors.services = 'Scegli un operatore per ogni servizio';
    setErrors(newErrors);
    // The message renders in the Servizi tab: show it, or Aggiungi looks like it did nothing.
    if (newErrors.services) setActiveTab('services');
    return !Object.values(newErrors).some(Boolean);
  }

  /** Detects whether the form has changed against the original fiche snapshot
   *  on the whitelisted fields (the same set forwarded to update_fiche_with_audit:
   *  client_id, datetime, note, total_override, miscela, tecnica) plus the
   *  fiche services/products lists (count + per-row id and final_price). The
   *  scope is intentionally narrow — status/paid live outside this form, and
   *  service/product mutations don't go through update_fiche_with_audit, so
   *  they're tracked separately by their own stores' realtime echo. */
  function hasFormChanges(): boolean {
    if (mode !== 'edit' || !fiche) return false;
    if (clientId !== fiche.client_id) return true;
    const originalIso = new Date(fiche.datetime).toISOString();
    const currentIso = baseTime.toISOString();
    if (originalIso !== currentIso) return true;
    if ((note ?? '') !== (fiche.note ?? '')) return true;
    if ((miscela.trim() || null) !== (fiche.miscela ?? null)) return true;
    if ((tecnica.trim() || null) !== (fiche.tecnica ?? null)) return true;
    if ((totalOverride ?? null) !== (fiche.total_override ?? null)) return true;

    const origServices = fiche.getFicheServices();
    if (ficheServices.length !== origServices.length) return true;
    const origServiceIds = new Set(origServices.map((s) => s.id));
    for (const draft of ficheServices) {
      if (!draft.id) return true; // newly added (no persisted id yet)
      if (!origServiceIds.has(draft.id)) return true;
      const orig = origServices.find((s) => s.id === draft.id);
      if (!orig) return true;
      if (Math.round(draft.final_price * 100) !== Math.round(orig.final_price * 100)) return true;
    }

    const origProducts = fiche.getFicheProducts();
    if (ficheProducts.length !== origProducts.length) return true;
    const origProductIds = new Set(origProducts.map((p) => p.id));
    for (const draft of ficheProducts) {
      if (!draft.id) return true;
      if (!origProductIds.has(draft.id)) return true;
      const orig = origProducts.find((p) => p.id === draft.id);
      if (!orig) return true;
      if (Math.round(draft.final_price * 100) !== Math.round(orig.final_price * 100)) return true;
      if ((draft.quantity ?? 1) !== (orig.quantity ?? 1)) return true;
    }

    return false;
  }

  /** Returns true when any service in the appointment falls outside the
   *  effective shifts for its assigned operator (operator's working_hours
   *  if set, otherwise the salon's operating_hours). */
  function isOutOfHours(): boolean {
    if (servicesWithTimes.length === 0) return false;
    const salonSched: DaySchedule[] = Array.isArray(salonHours) ? salonHours : [];
    return servicesWithTimes.some((svc) => {
      const op = operators.find((o) => o.id === svc.operator_id);
      const sched = effectiveScheduleFor(op?.working_hours ?? null, salonSched);
      return !isRangeWithinHours(sched, svc.start_time, svc.end_time);
    });
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    if (isSubmitting) return;
    if (pendingAction !== 'submit' && isOutOfHours()) {
      setPendingAction('submit');
      return;
    }
    // For CONCLUSA fiches, prompt for an optional edit reason before persisting.
    // The out-of-hours dialog runs first (above) so we don't stack two confirms.
    // Skip the prompt entirely when the form is unchanged — clicking "Salva"
    // on a no-op should just close the modal without spawning a confirm dialog
    // (and without writing an empty fiche_edits row).
    if (mode === 'edit' && fiche?.status === FicheStatus.COMPLETED && !showEditConfirm) {
      if (!hasFormChanges()) {
        onClose();
        return;
      }
      setShowEditConfirm(true);
      return;
    }
    await runPersist();
  }

  /** Change the method of a payment already registered on a closed fiche
   *  (e.g. closed as Contanti, the client actually paid by POS). Only the
   *  method changes: the amount stays, so the incassato is untouched. It is
   *  the only edit allowed on registered payments: rows are never added or
   *  removed after the close. The fiche_edits row that feeds the Cronologia
   *  tab is best-effort — the payment update is not rolled back if the audit
   *  insert fails. */
  async function handleChangePaymentMethod(payment: FichePayment, method: FichePaymentMethod) {
    if (!fiche?.id) return;
    if (updatingPaymentId) return;
    if (method === payment.method) return;
    const activeSalonId = useWorkspaceStore.getState().activeSalonId;
    if (!activeSalonId) {
      messagePopup.getState().error('Nessun salone attivo selezionato.');
      return;
    }
    setUpdatingPaymentId(payment.id);
    try {
      await updateFichePaymentMethod(payment.id, method);
      messagePopup.getState().success('Metodo di pagamento aggiornato');

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { error: editError } = user
          ? await supabase.from('fiche_edits').insert({
              salon_id: activeSalonId,
              fiche_id: fiche.id,
              edited_by: user.id,
              changes: {
                payment_method_changed: {
                  old: { method: payment.method, amount: payment.amount },
                  new: { method, amount: payment.amount },
                },
              },
              reason: null,
            })
          : { error: true };
        if (editError) {
          messagePopup
            .getState()
            .error('Metodo aggiornato ma cronologia non aggiornata');
        }
      } catch {
        messagePopup
          .getState()
          .error('Metodo aggiornato ma cronologia non aggiornata');
      }
    } catch (err) {
      messagePopup
        .getState()
        .error(err instanceof Error ? err.message : 'Errore durante il cambio del metodo di pagamento');
    } finally {
      setUpdatingPaymentId(null);
    }
  }

  /** Persist the form. When invoked from the closed-fiche confirm dialog,
   *  `reason` flows through to fiche_edits.reason. */
  async function runPersist(reason?: string, allowOperatorOverlap = false) {
    setIsSubmitting(true);
    try {
      await persistFiche(reason, allowOperatorOverlap);
      setShowEditConfirm(false);
      onClose();
      messagePopup.getState().success(mode === 'add' ? 'Appuntamento creato con successo' : 'Appuntamento aggiornato con successo');
      // Advances the "salva" step of the booking guide (no-op without a tour).
      if (mode === 'add') emitTourEvent('fiche:created');
    } catch (err) {
      if (err instanceof OperatorOverlapError) {
        setShowEditConfirm(false);
        setOverlapPrompt({ message: err.message, action: 'submit', reason });
        return;
      }
      setErrorMessage(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  }

  async function handlePay(allowOperatorOverlap = false) {
    if (!validateForm()) {
      setActiveTopTab('edit');
      return;
    }
    const payments = buildPayments(paymentView, effectiveTotal, cashGiven, splits);
    if (!payments) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ficheId = await persistFiche(undefined, allowOperatorOverlap);
      const salonId = fiche?.salon_id;
      if (!salonId) throw new Error('Salone mancante');

      // Redeem any selected coupons before closing the fiche so the operator
      // sees the failure and can react instead of having a closed fiche with
      // dangling un-redeemed coupons.
      for (const sel of selectedCoupons) {
        if (sel.amount > 0) await applyCoupon(sel.coupon.id, ficheId, sel.amount);
      }

      await closeFiche(ficheId, salonId, payments);
      // Advances the "Conferma pagamento" step of the incassa-fiche guide.
      emitTourEvent('fiche:closed');
      onClose();
      messagePopup.getState().success('Fiche chiusa con successo');
    } catch (err) {
      if (err instanceof OperatorOverlapError) {
        setOverlapPrompt({ message: err.message, action: 'pay' });
        return;
      }
      messagePopup.getState().error(err instanceof Error ? err.message : 'Errore durante la chiusura della fiche');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const readOnlyFieldClass =
    'w-full px-3 py-2 rounded-lg bg-hover text-sm whitespace-pre-wrap min-h-19';

  const isEdit = mode === 'edit';
  const currentBucket = getFicheBucket({
    datetime: baseTime,
    status: fiche?.status ?? FicheStatus.CREATED,
  });
  const paymentValid = isPaymentValid(paymentView, effectiveTotal, cashGiven, splits);

  // Per-tab footer derivations. The Modifica tab demotes "Salva" into the
  // dangerAction slot so "Incassa" (Procedi al pagamento) can take the
  // primary-button position — that's the real forward-flow action on an
  // open fiche. The Pagamento tab uses the standard primary slot for
  // "Conferma pagamento". The Cronologia tab has no actionable controls.
  const isEditTab = activeTopTab === 'edit';
  const isPaymentTab = activeTopTab === 'payment';
  const isHistoryTab = activeTopTab === 'history';

  // The Payment tab on a CONCLUSA fiche only lets the user change the method
  // of each registered payment, and that saves on selection, so we hide the
  // modal's primary confirm to avoid a misleading second action.
  const hideConfirm = isEdit
    ? isHistoryTab || isEditTab || (isPaymentTab && isCompleted)
    : false;

  const confirmText = !isEdit
    ? (isSubmitting ? 'Creazione…' : 'Aggiungi')
    : isPaymentTab
      ? (isSubmitting ? 'Chiusura…' : 'Conferma pagamento')
      : 'Salva';

  const onConfirm = isPaymentTab ? () => handlePay() : handleSubmit;
  const confirmDisabled = isSubmitting || (isPaymentTab && !paymentValid);

  // On an editable Pagamento, "Torna alla modifica" is the explicit retreat
  // — a second "Annulla" next to it reads as a duplicate and risks an
  // accidental modal-nuke when the user just wanted to step back. On a
  // completed Pagamento (read-only) we keep the button as the close path,
  // since "Torna alla modifica" isn't rendered.
  const hideCancel = isEdit && isPaymentTab && !isCompleted;
  // Read-only tabs (history, completed-payment) have nothing to annul.
  const cancelText = isHistoryTab || (isPaymentTab && isCompleted) ? 'Chiudi' : 'Annulla';

  // Totals only make sense where the operator is shaping the bill: in add
  // mode (creating a fiche) and on the Modifica tab. The Pagamento tab has
  // the full receipt on the left (same data, more detail) and the
  // Cronologia tab exposes no save action, so a totals block there would
  // be dead UI.
  const showFooterTotals = !isEdit || isEditTab;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onConfirm}
        // Advances the booking/edit tour once the modal has settled, so the next
        // step's coachmark measures the final layout. Add mode powers the
        // "clicca su uno spazio libero" step; edit mode powers the
        // "apri un appuntamento" step of the modifica-appuntamento tour.
        onEnterComplete={() => {
          if (mode === 'add') {
            emitTourEvent('fiche:modal-open');
            return;
          }
          // Edit mode: differentiate the entry point. Opening straight on the
          // payment tab (from the FicheCard "Chiudi Fiche" shortcut) powers the
          // incassa-fiche tour; everything else is the standard edit-open.
          if (initialView === 'payment') {
            emitTourEvent('fiche:checkout-open');
          } else {
            emitTourEvent('fiche:edit-open');
          }
        }}
        confirmDataTour={
          !isEdit
            ? 'save-fiche'
            : isPaymentTab && !isCompleted
              ? 'confirm-fiche-payment'
              : undefined
        }
        title={
          isEdit
            ? activeTopTab === 'payment'
              ? isCompleted
                ? 'Pagamenti'
                : 'Chiudi fiche'
              : activeTopTab === 'history'
                ? 'Cronologia fiche'
                : 'Modifica fiche'
            : 'Nuova fiche'
        }
        subtitle={
          isEdit
            ? activeTopTab === 'payment'
              ? isCompleted
                ? 'Riepilogo dei pagamenti registrati'
                : 'Incassa e chiudi la fiche'
              : activeTopTab === 'history'
                ? 'Tutte le modifiche registrate per questa fiche'
                : "Aggiorna i dettagli dell'appuntamento"
            : 'Crea un nuovo appuntamento'
        }
        classes="max-w-7xl w-[95vw] h-[92dvh]"
        confirmText={confirmText}
        confirmDisabled={confirmDisabled}
        hideConfirm={hideConfirm}
        cancelText={cancelText}
        hideCancel={hideCancel}
        footerContent={
          showFooterTotals ? (
            <div className="flex flex-col gap-1 min-w-50">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-[var(--lume-text-secondary)]">Subtotale</span>
                <span className={`text-xs tabular-nums ${hasOverride ? 'text-[var(--lume-text-muted)] line-through' : 'text-[var(--lume-text)]'}`}>
                  € {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs text-[var(--lume-text-secondary)]">Durata</span>
                <span className="text-xs tabular-nums text-[var(--lume-text)]">{totalDuration} min</span>
              </div>
              {isEdit && (
                <div className="border-t border-dashed border-line mt-1 pt-1.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[var(--lume-text)]">Totale</span>
                  <div className="flex items-center gap-1">
                    <NumberInput
                      value={totalOverride}
                      onChange={(v) => setTotalOverride(v)}
                      min={0}
                      step={0.5}
                      decimals={2}
                      placeholder={subtotal.toFixed(2)}
                      suffix="€"
                      size="sm"
                      className="w-24"
                      hideSteppers
                    />
                    {totalOverride !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Rimuovi sconto"
                        onClick={() => setTotalOverride(null)}
                      >
                        <RotateCcw />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : undefined
        }
        dangerAction={
          isEdit && isEditTab ? (
            <>
              <Button
                variant="secondary"
                leadingIcon={Check}
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Salva
              </Button>
              {!isCompleted && (
                <Button
                  variant="primary"
                  trailingIcon={ArrowRight}
                  onClick={() => {
                    if (!validateForm()) return;
                    setActiveTopTab('payment');
                  }}
                >
                  Incassa
                </Button>
              )}
              <Button
                variant="ghost-destructive"
                leadingIcon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
                data-tour="fiche-delete"
              >
                Elimina
              </Button>
            </>
          ) : isEdit && isPaymentTab && !isCompleted ? (
            <Button
              variant="ghost"
              leadingIcon={ArrowLeft}
              onClick={() => setActiveTopTab('edit')}
            >
              Torna alla modifica
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-4 h-full min-h-0">

          {isEdit && (
            <TabBar label="Sezioni della fiche" className="shrink-0">
              {(
                [
                  { id: 'edit' as const, label: 'Modifica', icon: Pencil, show: true },
                  { id: 'payment' as const, label: 'Pagamento', icon: ReceiptText, show: true },
                  { id: 'history' as const, label: 'Cronologia', icon: History, show: true },
                ]
              )
                .filter((t) => t.show)
                .map(({ id, label, icon: Icon }) => {
                  const isActive = activeTopTab === id;
                  return (
                    <TabButton
                      key={id}
                      active={isActive}
                      id={`fiche-tab-${id}`}
                      aria-controls={`fiche-panel-${id}`}
                      onClick={() => {
                        // Going TO the payment tab from "edit" still requires
                        // a valid form for not-yet-closed fiches (so the
                        // close-fiche flow has the right data). For closed
                        // fiches the payment tab only changes payment
                        // methods, so no validation is needed.
                        if (id === 'payment' && !isCompleted) {
                          if (!validateForm()) return;
                        }
                        setActiveTopTab(id);
                      }}
                    >
                      <Icon />
                      {label}
                    </TabButton>
                  );
                })}
            </TabBar>
          )}

          {activeTopTab === 'edit' ? (
            /* ══ MODIFICA TAB ═══════════════════════════════════════════════ */
            <div
              role="tabpanel"
              id="fiche-panel-edit"
              aria-labelledby="fiche-tab-edit"
              className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 xl:gap-8 flex-1 min-h-0 overflow-y-auto xl:overflow-visible"
            >

              {/* ── LEFT: Dettagli ── */}
              <div data-tour="fiche-details" className="flex flex-col gap-5 xl:overflow-y-auto xl:pr-1">

                {/* Row 1: Data, Cliente, Stato — 3-col below 2xl when there's room, stacked at 2xl (narrow column) */}
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-5">
                  <div data-tour="fiche-field-datetime">
                    <Field label="Data e ora" labelIcon={Calendar} required error={errors.datetime}>
                      {({ id }) => (
                        <DateTimeField id={id} aria-label="Data e ora" value={datetimeStr} onChange={handleDatetimeChange} />
                      )}
                    </Field>
                  </div>

                  <Field label="Cliente" labelIcon={User} required error={errors.client_id}>
                    {({ id, invalid }) => (
                    <Select
                      id={id}
                      invalid={invalid}
                      options={clientOptions}
                      labelKey="fullName"
                      valueKey="id"
                      value={clientId}
                      onChange={(v) => {
                        setClientId(v);
                        // Advances the "scegli il cliente" step of the booking guide.
                        emitTourEvent('fiche:client-selected');
                      }}
                      placeholder="Cerca cliente…"
                      maxHeight="max-h-48"
                      createAction={{
                        label: 'Nuovo',
                        onClick: () => {
                          setQuickAddPrefill({ firstName: '', lastName: '' });
                          setQuickAddOpen(true);
                        },
                      }}
                      onCreateFromSearch={(text) => {
                        const trimmed = text.trim();
                        const i = trimmed.indexOf(' ');
                        const firstName = i === -1 ? trimmed : trimmed.slice(0, i);
                        const lastName = i === -1 ? '' : trimmed.slice(i + 1);
                        setQuickAddPrefill({ firstName, lastName });
                        setQuickAddOpen(true);
                      }}
                    />
                    )}
                  </Field>

                  <Field label="Stato" labelIcon={Check}>
                    {({ id }) => (
                      <Tooltip label="Lo stato è derivato dalla data e dal pagamento">
                        <span id={id} className="self-start inline-flex items-center h-[var(--lume-control-h-md)]">
                          <StatusDot tone={FICHE_BUCKET_TONE[currentBucket]} className="text-sm">
                            {FICHE_BUCKET_LABELS[currentBucket]}
                          </StatusDot>
                        </span>
                      </Tooltip>
                    )}
                  </Field>
                </div>

                <div className="flex flex-col gap-2">
                  <TabBar label="Scheda tecnica">
                    {([
                      { id: 'new', label: 'Scheda tecnica' },
                      { id: 'last', label: 'Ultima scheda' },
                    ] as { id: 'new' | 'last'; label: string }[]).map(({ id, label }) => (
                      <TabButton key={id} active={treatmentTab === id} onClick={() => setTreatmentTab(id)}>
                        {label}
                      </TabButton>
                    ))}
                  </TabBar>

                  {treatmentTab === 'new' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-3 pt-1">
                      <TextArea
                        label="Miscela"
                        labelIcon={FlaskConical}
                        rows={3}
                        value={miscela}
                        onChange={(e) => setMiscela(e.target.value)}
                        placeholder="Codice colore…"
                      />
                      <TextArea
                        label="Tecnica"
                        labelIcon={Sparkles}
                        rows={3}
                        value={tecnica}
                        onChange={(e) => setTecnica(e.target.value)}
                        placeholder="Es. balayage…"
                      />
                      <TextArea
                        label="Nota appuntamento"
                        labelIcon={FileText}
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Note per questo appuntamento…"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-1">
                      {lastTreatment && (
                        <p className="text-xs text-[var(--lume-text-secondary)]">
                          {format(new Date(lastTreatment.datetime), "d MMMM yyyy", { locale: it })}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-3">
                        {(['miscela', 'tecnica', 'note'] as const).map((field) => {
                          const config = {
                            miscela: { icon: FlaskConical, label: 'Miscela', empty: 'Nessuna miscela precedente' },
                            tecnica: { icon: Sparkles, label: 'Tecnica', empty: 'Nessuna tecnica precedente' },
                            note: { icon: FileText, label: 'Nota appuntamento', empty: 'Nessuna nota precedente' },
                          }[field];
                          const Icon = config.icon;
                          const value = lastTreatment?.[field] ?? '';
                          const placeholder = selectedClient ? config.empty : 'Seleziona un cliente…';
                          return (
                            <Field key={field} label={config.label} labelIcon={Icon}>
                              {({ id }) => (
                                <div
                                  id={id}
                                  className={`${readOnlyFieldClass} ${value ? 'text-[var(--lume-text-secondary)]' : 'text-[var(--lume-text-muted)]'}`}
                                >
                                  {value || placeholder}
                                </div>
                              )}
                            </Field>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ── RIGHT: Servizi / Prodotti ── */}
              <div data-tour="fiche-services" className="flex flex-col gap-4 min-h-0">

                {/* Tab switcher (nested) */}
                <TabBar label="Servizi e prodotti" className="shrink-0">
                    {([
                      { id: 'services', label: 'Servizi', icon: Scissors, count: ficheServices.length },
                      { id: 'products', label: 'Prodotti', icon: Package, count: ficheProducts.length },
                    ] as { id: 'services' | 'products'; label: string; icon: React.ElementType; count: number }[]).map(({ id, label, icon: Icon, count }) => {
                      const isActive = activeTab === id;
                      return (
                        <TabButton key={id} active={isActive} count={count > 0 ? count : undefined} onClick={() => setActiveTab(id)}>
                          <Icon />
                          {label}
                        </TabButton>
                      );
                    })}
                  </TabBar>

                  {/* ── SERVICES TAB ── */}
                  {activeTab === 'services' && (
                    <>
                      <CatalogSearch
                        query={svcQuery}
                        onQueryChange={setSvcQuery}
                        placeholder="Cerca e aggiungi servizi…"
                        groups={groupedServices}
                        onSelect={addServiceToList}
                        getKey={(svc) => svc.id}
                        emptyText="Nessun servizio trovato"
                        renderLabel={(svc) => svc.name}
                        renderTrailing={(svc) => (
                          <span className="flex items-center gap-2.5 text-xs font-normal text-[var(--lume-text-muted)] shrink-0">
                            <span className="flex items-center gap-1"><Clock className="size-3" />{svc.duration} min</span>
                            <span className="flex items-center gap-1"><Euro className="size-3" />{svc.price.toFixed(2)}</span>
                          </span>
                        )}
                      />

                      {errors.services && <p className="text-xs text-danger-strong -mt-2">{errors.services}</p>}

                      <div className="surface-card flex flex-col xl:flex-1 xl:min-h-0">
                        {ficheServices.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--lume-text-muted)]">
                            <Scissors className="size-6 text-[var(--lume-text-muted)]" strokeWidth={1.5} />
                            <p className="text-sm">Nessun servizio aggiunto</p>
                            <p className="text-xs opacity-60">Cerca e clicca per aggiungere</p>
                          </div>
                        ) : (
                          <>
                            <div
                              className="grid items-center px-3 py-2 border-b border-line text-xs font-medium text-[var(--lume-text-secondary)] shrink-0 rounded-t-xl"
                              style={{ gridTemplateColumns: TABLE_COLS }}
                            >
                              <span className="flex items-center gap-1"><Scissors className="size-3" />Servizio</span>
                              <span className="flex items-center gap-1"><User className="size-3" />Operatore</span>
                              <span className="flex items-center gap-1 justify-center"><Clock className="size-3" />Min</span>
                              <span className="text-center">Inizio</span>
                              <span className="text-center">Fine</span>
                              <span className="flex items-center gap-1 justify-end"><Euro className="size-3" />Prezzo</span>
                              <span />
                              <Tooltip label="Abbonamento"><span className="text-center">Abb.</span></Tooltip>
                              <span />
                            </div>

                            <div className="divide-y divide-line xl:overflow-y-auto xl:overscroll-contain">
                              {servicesWithTimes.map((svc, i) => (
                                <div
                                  key={svc.id ?? i}
                                  className="grid items-center px-3 py-2.5"
                                  style={{ gridTemplateColumns: TABLE_COLS }}
                                >
                                  {(() => {
                                    const catalogName = services.find((cat) => cat.id === svc.service_id)?.name ?? '';
                                    const isOverridden = catalogName !== '' && svc.name !== catalogName;
                                    return (
                                      <div className="flex items-center gap-1 pr-2 min-w-0">
                                        <FormInput
                                          type="text"
                                          size="sm"
                                          value={svc.name}
                                          onChange={(e) => updateServiceName(i, e.target.value)}
                                          fieldClassName="flex-1"
                                          aria-label="Nome servizio"
                                        />
                                        {isOverridden && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            iconOnly
                                            aria-label="Ripristina nome originale"
                                            onClick={() => resetServiceName(i)}
                                          >
                                            <RotateCcw />
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <div className="pr-2">
                                    <Select
                                      options={operatorOptions}
                                      labelKey="fullName"
                                      valueKey="id"
                                      value={svc.operator_id}
                                      onChange={(v) => updateServiceOperator(i, v)}
                                      placeholder="—"
                                      maxHeight="max-h-40"
                                      size="sm"
                                    />
                                  </div>

                                  <div className="flex justify-center">
                                    <NumberInput
                                      value={svc.duration}
                                      onChange={(v) => updateServiceDuration(i, v ?? 5)}
                                      min={5}
                                      step={5}
                                      size="sm"
                                    />
                                  </div>

                                  <span className="text-sm text-center tabular-nums text-[var(--lume-text-secondary)]">
                                    {format(svc.start_time, 'HH:mm', { locale: it })}
                                  </span>
                                  <span className="text-sm text-center tabular-nums text-[var(--lume-text-secondary)]">
                                    {format(svc.end_time, 'HH:mm', { locale: it })}
                                  </span>

                                  <div className="flex justify-end">
                                    <NumberInput
                                      value={svc.final_price}
                                      onChange={(v) => updateServicePrice(i, v ?? 0)}
                                      min={0}
                                      step={0.5}
                                      decimals={2}
                                      suffix="€"
                                      size="sm"
                                      disabled={!!svc.abbonamento_id}
                                    />
                                  </div>

                                  <div className="flex justify-center">
                                    <GiftToggle
                                      active={svc.final_price === 0}
                                      disabled={!!svc.abbonamento_id}
                                      onClick={() => updateServicePrice(i, svc.final_price === 0 ? svc.list_price : 0)}
                                    />
                                  </div>

                                  <AbbonamentoCell
                                    clientId={clientId}
                                    serviceId={svc.service_id}
                                    currentAbbonamentoId={svc.abbonamento_id}
                                    otherDraftAssignments={abbonamentoDraftCounts(ficheServices, i)}
                                    onChange={(id) => setServiceAbbonamento(i, id)}
                                  />

                                  <div className="flex justify-end">
                                    <Button
                                      variant="ghost-destructive"
                                      size="sm"
                                      iconOnly
                                      aria-label="Rimuovi servizio"
                                      onClick={() => removeService(i)}
                                    >
                                      <Trash2 />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── PRODUCTS TAB ── */}
                  {activeTab === 'products' && (
                    <>
                      <CatalogSearch
                        query={prodQuery}
                        onQueryChange={setProdQuery}
                        placeholder="Cerca e aggiungi prodotti…"
                        groups={groupedProducts}
                        onSelect={addProductToList}
                        getKey={(prod) => prod.id}
                        emptyText="Nessun prodotto trovato"
                        renderLabel={(prod) => prod.name}
                        renderTrailing={(prod) => (
                          <span className="flex items-center gap-1 text-xs font-normal text-[var(--lume-text-muted)] shrink-0">
                            <Euro className="size-3" />{(prod.sell_price ?? prod.price)?.toFixed(2) ?? '—'}
                          </span>
                        )}
                      />

                      <div className="surface-card flex flex-col xl:flex-1 xl:min-h-0">
                        {ficheProducts.length > 0 && (
                          <div className="flex items-center px-3 py-2 border-b border-line text-xs font-medium text-[var(--lume-text-secondary)] shrink-0 rounded-t-xl">
                            <span className="flex items-center gap-1 flex-1 min-w-0"><Package className="size-3" />Prodotto</span>
                            <span className="flex items-center gap-1 shrink-0 mr-4">Qtà</span>
                            <span className="flex items-center gap-1 shrink-0 mr-6"><Euro className="size-3" />Totale</span>
                            <span className="size-6" />
                          </div>
                        )}
                        {ficheProducts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--lume-text-muted)]">
                            <Package className="size-6 text-[var(--lume-text-muted)]" strokeWidth={1.5} />
                            <p className="text-sm">Nessun prodotto aggiunto</p>
                            <p className="text-xs opacity-60">Cerca e clicca per aggiungere</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-line xl:overflow-y-auto xl:overscroll-contain">
                            {ficheProducts.map((prod) => (
                              <div key={prod.product_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm text-[var(--lume-text)] truncate">{prod.name}</span>
                                  <span className="text-xs text-[var(--lume-text-muted)]">{prod.list_price.toFixed(2)} € / pz</span>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  <NumberInput
                                    value={prod.quantity}
                                    onChange={(v) => setProductQuantity(prod.product_id, String(v ?? 1))}
                                    min={1}
                                    step={1}
                                    size="sm"
                                    className="w-16"
                                  />

                                  <div className="flex items-center gap-1 shrink-0">
                                    <GiftToggle
                                      active={prod.final_price === 0}
                                      onClick={() => setProductLineTotal(prod.product_id, prod.final_price === 0 ? String(prod.list_price * prod.quantity) : '0')}
                                    />
                                    <NumberInput
                                      value={prod.final_price}
                                      onChange={(v) => setProductLineTotal(prod.product_id, v === null ? '' : String(v))}
                                      min={0}
                                      step={0.5}
                                      decimals={2}
                                      suffix="€"
                                      hideSteppers
                                      size="sm"
                                      className="w-24"
                                    />
                                  </div>

                                  <Button
                                    variant="ghost-destructive"
                                    size="sm"
                                    iconOnly
                                    aria-label="Rimuovi prodotto"
                                    onClick={() => removeProduct(prod.product_id)}
                                  >
                                    <Trash2 />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                {errorMessage && <p className="text-xs text-danger-strong shrink-0">{errorMessage}</p>}
              </div>
            </div>
          ) : activeTopTab === 'history' ? (
            /* ══ CRONOLOGIA TAB ═════════════════════════════════════════════ */
            <div
              role="tabpanel"
              id="fiche-panel-history"
              aria-labelledby="fiche-tab-history"
              className="flex flex-col flex-1 min-h-0"
            >
              {fiche?.id ? (
                <FicheHistoryTab ficheId={fiche.id} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--lume-text-muted)]">
                  <History className="size-10 opacity-30" />
                  <p className="text-sm">Cronologia non disponibile.</p>
                </div>
              )}
            </div>
          ) : isCompleted ? (
            /* ══ PAGAMENTO TAB — fiche già chiusa (solo metodo modificabile) ══════ */
            <div
              role="tabpanel"
              id="fiche-panel-payment"
              aria-labelledby="fiche-tab-payment"
              className="grid gap-8 flex-1 min-h-0"
              style={{ gridTemplateColumns: '20rem 1fr' }}
            >
              <div className="overflow-y-auto min-h-0">
                <FicheReceipt
                  clientName={clientName}
                  ficheId={fiche?.id}
                  datetime={baseTime}
                  services={ficheServices}
                  products={ficheProducts}
                  subtotal={subtotal}
                  totalOverride={totalOverride}
                  salonName={salonName}
                  couponDiscounts={selectedCoupons.map((c) => ({
                    label: c.coupon.kind === 'gift_card' ? 'Gift card' : 'Coupon',
                    detail: c.coupon.displayDiscount(),
                    amount: c.amount,
                  }))}
                />
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
                {showPaymentMismatch && (
                  <Callout tone="warning">
                    Incassato <span className="font-medium tabular-nums text-[var(--lume-text)]">{formatCurrency(paidSum)}</span>,
                    totale ora <span className="font-medium tabular-nums text-[var(--lume-text)]">{formatCurrency(closedFicheCurrentTotal)}</span>.{' '}
                    {paymentDelta > 0
                      ? `Mancano ${formatCurrency(paymentDelta)}.`
                      : `Cliente in credito di ${formatCurrency(Math.abs(paymentDelta))}.`}
                  </Callout>
                )}

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-[var(--lume-text-secondary)]">
                    Pagamenti registrati
                  </p>
                  {existingPayments.length === 0 ? (
                    <p className="text-sm text-[var(--lume-text-muted)]">Nessun pagamento registrato.</p>
                  ) : (
                    <ul className="flex flex-col gap-2 list-none pl-0">
                      {existingPayments.map((p) => {
                        return (
                          <li
                            key={p.id}
                            className="surface-card flex items-center justify-between gap-3 px-3 py-2 text-sm"
                          >
                            <Select
                              value={p.method}
                              onChange={(v) => void handleChangePaymentMethod(p, v as FichePaymentMethod)}
                              options={[
                                { value: FichePaymentMethod.CASH, label: 'Contanti' },
                                { value: FichePaymentMethod.POS, label: 'POS' },
                                { value: FichePaymentMethod.OTHER, label: 'Altro' },
                              ]}
                              labelKey="label"
                              valueKey="value"
                              searchable={false}
                              disabled={updatingPaymentId !== null}
                              size="sm"
                              className="w-36"
                            />
                            <span className="text-[var(--lume-text)] tabular-nums">
                              {formatCurrency(p.amount)}
                            </span>
                            <span className="text-xs text-[var(--lume-text-secondary)] ml-auto">
                              {format(new Date(p.created_at), 'd MMM yyyy', { locale: it })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

              </div>
            </div>
          ) : (
            /* ══ PAGAMENTO TAB — fiche da chiudere (close-flow) ═════════════ */
            <div
              role="tabpanel"
              id="fiche-panel-payment"
              aria-labelledby="fiche-tab-payment"
              className="grid gap-8 flex-1 min-h-0"
              style={{ gridTemplateColumns: '20rem 1fr' }}
            >
              <div className="overflow-y-auto min-h-0">
                <FicheReceipt
                  clientName={clientName}
                  ficheId={fiche?.id}
                  datetime={baseTime}
                  services={ficheServices}
                  products={ficheProducts}
                  subtotal={subtotal}
                  totalOverride={totalOverride}
                  salonName={salonName}
                  couponDiscounts={selectedCoupons.map((c) => ({
                    label: c.coupon.kind === 'gift_card' ? 'Gift card' : 'Coupon',
                    detail: c.coupon.displayDiscount(),
                    amount: c.amount,
                  }))}
                />
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
                <CouponSuggestionsPanel
                  clientId={clientId}
                  services={ficheServices}
                  products={ficheProducts}
                  selected={selectedCoupons}
                  onSelectedChange={setSelectedCoupons}
                />
                <FichePaymentPanel
                  total={effectiveTotal}
                  view={paymentView}
                  onViewChange={setPaymentView}
                  cashGiven={cashGiven}
                  onCashGivenChange={setCashGiven}
                  splits={splits}
                  onSplitsChange={setSplits}
                />
              </div>
            </div>
          )}

        </div>
      </AddModal>

      {isEdit && (
        <DeleteModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        >
          <p className="text-sm text-[var(--lume-text-secondary)]">
            Sei sicuro di voler eliminare questa fiche? L&apos;azione è irreversibile.
          </p>
        </DeleteModal>
      )}

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleSubmit}
        title="Fuori orari di lavoro"
        description={
          servicesWithTimes.length > 0
            ? `L'appuntamento è previsto dalle ${format(
                servicesWithTimes.reduce((m, s) => (s.start_time < m ? s.start_time : m), servicesWithTimes[0].start_time),
                'HH:mm',
                { locale: it },
              )} alle ${format(
                servicesWithTimes.reduce((m, s) => (s.end_time > m ? s.end_time : m), servicesWithTimes[0].end_time),
                'HH:mm',
                { locale: it },
              )}, fuori dagli orari di apertura del salone. Confermi di voler creare l'appuntamento comunque?`
            : "L'appuntamento è fuori dagli orari configurati"
        }
        confirmLabel="Conferma comunque"
      />

      <ConfirmDialog
        isOpen={overlapPrompt !== null}
        onClose={() => setOverlapPrompt(null)}
        onConfirm={() => {
          const prompt = overlapPrompt;
          setOverlapPrompt(null);
          if (!prompt) return;
          if (prompt.action === 'pay') void handlePay(true);
          else void runPersist(prompt.reason, true);
        }}
        title="Operatore già occupato"
        description={`${overlapPrompt?.message ?? ''} Vuoi salvare comunque? Sul calendario i due appuntamenti appariranno affiancati.`}
        confirmLabel="Salva comunque"
      />

      <ConfirmEditClosedFicheDialog
        isOpen={showEditConfirm}
        onClose={() => {
          if (!isSubmitting) setShowEditConfirm(false);
        }}
        onConfirm={(reason) => {
          void runPersist(reason);
        }}
        isSubmitting={isSubmitting}
      />

      <QuickAddClientModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        initialFirstName={quickAddPrefill.firstName}
        initialLastName={quickAddPrefill.lastName}
        onCreated={(client) => setClientId(client.id)}
      />
    </>
  );
}
