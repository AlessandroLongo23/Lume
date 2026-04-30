'use client';

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Search, Scissors, User, Clock, Euro, Trash2, FileText, Calendar,
  Check, AlertTriangle, Package, Plus, Pencil, ReceiptText, ArrowLeft, X, Gift,
  FlaskConical, Sparkles, RotateCcw,
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import { useFichesStore } from '@/lib/stores/fiches';
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
import { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { validateFicheConflicts } from '@/lib/actions/fiches';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
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
import { useCouponsStore } from '@/lib/stores/coupons';
import type { Fiche } from '@/lib/types/Fiche';
import type { Operator } from '@/lib/types/Operator';
import type { Service } from '@/lib/types/Service';
import type { Product } from '@/lib/types/Product';
import type { FicheProduct } from '@/lib/types/FicheProduct';
import type { FicheServiceDraft, FicheProductDraft } from '@/lib/types/FicheDraft';
import { isRangeWithinHours, type DaySchedule } from '@/lib/utils/operating-hours';

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

const TABLE_COLS = '1fr 1.5fr 96px 60px 60px 96px 28px 56px 32px';

interface CategoryGroup<T> {
  categoryId: string;
  categoryName: string;
  items: T[];
}

interface CategoryDropdownProps<T> {
  groups: CategoryGroup<T>[];
  query: string;
  onSelect: (item: T) => void;
  renderItem: (item: T) => ReactNode;
  getKey: (item: T) => string;
  emptyText: string;
}

function CategoryDropdown<T>({
  groups,
  query,
  onSelect,
  renderItem,
  getKey,
  emptyText,
}: CategoryDropdownProps<T>) {
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

  if (groups.length === 0) {
    return <p className="p-4 text-sm text-center text-zinc-500">{emptyText}</p>;
  }

  if (query.trim()) {
    const allItems = groups.flatMap((g) => g.items);
    return (
      <div className="max-h-72 overflow-y-auto">
        {allItems.map((item) => (
          <button
            key={getKey(item)}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 text-sm transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer"
          >
            {renderItem(item)}
          </button>
        ))}
      </div>
    );
  }

  const activeId =
    hoveredCategoryId && groups.some((g) => g.categoryId === hoveredCategoryId)
      ? hoveredCategoryId
      : groups[0].categoryId;
  const activeGroup = groups.find((g) => g.categoryId === activeId);

  return (
    <div className="grid max-h-72" style={{ gridTemplateColumns: '1fr 2.5fr' }}>
      <div className="overflow-y-auto border-r border-zinc-500/15 bg-zinc-50/50 dark:bg-zinc-700/20">
        {groups.map((g) => {
          const isActive = g.categoryId === activeId;
          return (
            <button
              key={g.categoryId}
              type="button"
              onMouseEnter={() => setHoveredCategoryId(g.categoryId)}
              onFocus={() => setHoveredCategoryId(g.categoryId)}
              className={`w-full px-3 py-2 text-left text-sm truncate transition-colors cursor-default ${
                isActive
                  ? 'bg-primary/10 text-primary-hover dark:text-primary/70 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-500/5'
              }`}
            >
              {g.categoryName}
            </button>
          );
        })}
      </div>
      <div className="overflow-y-auto">
        {activeGroup?.items.map((item) => (
          <button
            key={getKey(item)}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 text-sm transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer"
          >
            {renderItem(item)}
          </button>
        ))}
      </div>
    </div>
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

  const [clientId, setClientId] = useState('');
  const [datetimeStr, setDatetimeStr] = useState('');
  const [note, setNote] = useState('');
  const [miscela, setMiscela] = useState('');
  const [tecnica, setTecnica] = useState('');
  const [status, setStatus] = useState<FicheStatus>(FicheStatus.CREATED);
  const [ficheServices, setFicheServices] = useState<FicheServiceDraft[]>([]);
  const [ficheProducts, setFicheProducts] = useState<FicheProductDraft[]>([]);
  const [totalOverride, setTotalOverride] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [svcQuery, setSvcQuery] = useState('');
  const [svcOpen, setSvcOpen] = useState(false);
  const [prodQuery, setProdQuery] = useState('');
  const [prodOpen, setProdOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'products'>('services');
  const [activeTopTab, setActiveTopTab] = useState<'edit' | 'payment'>('edit');
  const [treatmentTab, setTreatmentTab] = useState<'new' | 'last'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingHours, setOperatingHours] = useState<DaySchedule[]>([]);
  const [pendingAction, setPendingAction] = useState<'submit' | null>(null);

  // Payment state
  const [paymentView, setPaymentView] = useState<PaymentView>(FichePaymentMethod.CASH);
  const [cashGiven, setCashGiven] = useState<number | null>(null);
  const [splits, setSplits] = useState<Split[]>(INITIAL_SPLITS.map((s) => ({ ...s })));
  const [selectedCoupons, setSelectedCoupons] = useState<SelectedCoupon[]>([]);

  const svcInputRef = useRef<HTMLInputElement>(null);
  const svcDropdownRef = useRef<HTMLDivElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const prodDropdownRef = useRef<HTMLDivElement>(null);

  // Initialise state when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && fiche) {
      setClientId(fiche.client_id);
      setDatetimeStr(toDatetimeLocal(new Date(fiche.datetime)));
      setNote(fiche.note ?? '');
      setMiscela(fiche.miscela ?? '');
      setTecnica(fiche.tecnica ?? '');
      setStatus(fiche.status);
      setTotalOverride(fiche.total_override ?? null);
      setFicheServices(
        fiche.getFicheServices().map((fs) => {
          const svc = services.find((s) => s.id === fs.service_id);
          return {
            id: fs.id,
            service_id: fs.service_id,
            name: fs.name || svc?.name || 'Servizio',
            operator_id: fs.operator_id ?? '',
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
      setStatus(FicheStatus.CREATED);
      setTotalOverride(null);
      setFicheServices([]);
      setFicheProducts([]);
    }
    setErrors({});
    setErrorMessage('');
    setSvcQuery('');
    setSvcOpen(false);
    setProdQuery('');
    setProdOpen(false);
    setActiveTab('services');
    setActiveTopTab(initialView ?? 'edit');
    setTreatmentTab('new');
    setPaymentView(FichePaymentMethod.CASH);
    setCashGiven(null);
    setSplits(INITIAL_SPLITS.map((s) => ({ ...s })));
    setSelectedCoupons([]);
    setIsSubmitting(false);
    setPendingAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, fiche, mode, initialView]);

  // Fetch operating hours once the modal opens so we can warn when the
  // appointment falls outside configured shifts.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.operating_hours)) {
          setOperatingHours(data.operating_hours as DaySchedule[]);
        }
      })
      .catch(() => {
        // leave empty → isRangeWithinHours returns true (safe fallback)
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  // Sync datetime when the calendar slot changes while the modal is already open (add mode only)
  useEffect(() => {
    if (mode === 'add') setDatetimeStr(toDatetimeLocal(datetime));
  }, [datetime, mode]);

  // Close service dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (svcDropdownRef.current && !svcDropdownRef.current.contains(e.target as Node)) {
        setSvcOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close product dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (prodDropdownRef.current && !prodDropdownRef.current.contains(e.target as Node)) {
        setProdOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const baseTime = useMemo(() => {
    if (!datetimeStr) return new Date();
    const d = new Date(datetimeStr);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [datetimeStr]);

  const servicesWithTimes = useMemo(() => {
    let cursor = baseTime;
    return ficheServices.map((s) => {
      const start_time = cursor;
      const end_time = addMinutes(cursor, s.duration);
      cursor = end_time;
      return { ...s, start_time, end_time };
    });
  }, [ficheServices, baseTime]);

  const totalDuration = useMemo(() => ficheServices.reduce((acc, s) => acc + s.duration, 0), [ficheServices]);
  const subtotal = useMemo(
    () =>
      ficheServices.reduce((acc, s) => acc + s.final_price, 0) +
      ficheProducts.reduce((acc, p) => acc + p.final_price * p.quantity, 0),
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
      if (!groups.has(svc.category_id)) {
        groups.set(svc.category_id, { categoryId: svc.category_id, categoryName: catName, items: [] });
      }
      groups.get(svc.category_id)!.items.push(svc);
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
      if (!groups.has(prod.product_category_id)) {
        groups.set(prod.product_category_id, { categoryId: prod.product_category_id, categoryName: catName, items: [] });
      }
      groups.get(prod.product_category_id)!.items.push(prod);
    }
    return Array.from(groups.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'it'));
  }, [products, productCategories, prodQuery]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  function addServiceToList(svc: Service) {
    const operatorId = mode === 'add' ? (operator?.id ?? '') : '';
    setFicheServices((prev) => [
      ...prev,
      { service_id: svc.id, name: svc.name, operator_id: operatorId, duration: svc.duration, list_price: svc.price, final_price: svc.price, abbonamento_id: null },
    ]);
    setSvcQuery('');
    setSvcOpen(false);
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
    setFicheServices((prev) => prev.filter((_, i) => i !== index));
  }

  function updateServiceOperator(index: number, operatorId: string) {
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, operator_id: operatorId } : s)));
  }

  function updateServiceDuration(index: number, raw: number) {
    const duration = Math.max(5, raw || 5);
    setFicheServices((prev) => prev.map((s, i) => (i === index ? { ...s, duration } : s)));
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
      const snapPrice = prod.sell_price ?? prod.price;
      return [...prev, { product_id: prod.id, name: prod.name, quantity: 1, list_price: snapPrice, final_price: snapPrice }];
    });
    setProdQuery('');
    setProdOpen(false);
  }

  function updateProductQuantity(productId: string, delta: number) {
    setFicheProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== productId) return p;
        const qty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: qty, final_price: p.list_price * qty };
      }),
    );
  }

  function setProductQuantity(productId: string, raw: string) {
    const qty = Math.max(1, parseInt(raw, 10) || 1);
    setFicheProducts((prev) =>
      prev.map((p) => p.product_id === productId ? { ...p, quantity: qty, final_price: p.list_price * qty } : p),
    );
  }

  function setProductFinalPrice(productId: string, raw: string) {
    const price = parseFloat(raw);
    setFicheProducts((prev) =>
      prev.map((p) => p.product_id === productId ? { ...p, final_price: isNaN(price) ? p.final_price : price } : p),
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

  /** Persist all fiche fields + services + products. Returns the fiche id on success, throws on failure. */
  async function persistFiche(): Promise<string> {
    const validation = await validateFicheConflicts(
      clientId,
      servicesWithTimes.map((svc) => ({
        operator_id: svc.operator_id,
        operator_name: operators.find((op) => op.id === svc.operator_id)?.getFullName() ?? svc.operator_id,
        start_time: svc.start_time.toISOString(),
        end_time: svc.end_time.toISOString(),
      })),
      mode === 'edit' ? fiche?.id : undefined,
    );
    if (validation.error) throw new Error(validation.error);

    if (mode === 'add') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newFiche = await addFiche({ client_id: clientId, datetime: baseTime as any, status, note, total_override: totalOverride, miscela: miscela.trim() || null, tecnica: tecnica.trim() || null });
      await Promise.all(
        servicesWithTimes.map((svc) =>
          addFicheService({
            fiche_id: newFiche.id,
            service_id: svc.service_id,
            name: svc.name,
            operator_id: svc.operator_id || undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            start_time: svc.start_time as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            end_time: svc.end_time as any,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateFiche(fiche.id, { client_id: clientId, datetime: baseTime as any, status, note, total_override: totalOverride, miscela: miscela.trim() || null, tecnica: tecnica.trim() || null });

    const currentServiceIds = new Set(ficheServices.filter((s) => s.id).map((s) => s.id!));
    for (const fs of fiche.getFicheServices()) {
      if (!currentServiceIds.has(fs.id)) await deleteFicheService(fs.id);
    }
    for (const svc of servicesWithTimes) {
      if (svc.id) {
        await updateFicheService(svc.id, {
          name: svc.name,
          operator_id: svc.operator_id || undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          start_time: svc.start_time as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          end_time: svc.end_time as any,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          start_time: svc.start_time as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          end_time: svc.end_time as any,
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
    if (!ficheServices.length) newErrors.services = 'Aggiungi almeno un servizio';
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  }

  /** Returns true when the appointment (first service start → last service end) falls outside configured shifts. */
  function isOutOfHours(): boolean {
    if (ficheServices.length === 0) return false;
    const firstStart = servicesWithTimes[0].start_time;
    const lastEnd = servicesWithTimes[servicesWithTimes.length - 1].end_time;
    return !isRangeWithinHours(operatingHours, firstStart, lastEnd);
  }

  async function handleSubmit() {
    if (!validateForm()) return;
    if (isSubmitting) return;
    if (pendingAction !== 'submit' && isOutOfHours()) {
      setPendingAction('submit');
      return;
    }
    setIsSubmitting(true);
    try {
      await persistFiche();
      onClose();
      messagePopup.getState().success(mode === 'add' ? 'Appuntamento creato con successo' : 'Appuntamento aggiornato con successo');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Si è verificato un errore sconosciuto');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  }

  async function handlePay() {
    if (!validateForm()) {
      setActiveTopTab('edit');
      return;
    }
    const payments = buildPayments(paymentView, effectiveTotal, cashGiven, splits);
    if (!payments) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ficheId = await persistFiche();
      const salonId = fiche?.salon_id;
      if (!salonId) throw new Error('Salone mancante');

      // Redeem any selected coupons before closing the fiche so the operator
      // sees the failure and can react instead of having a closed fiche with
      // dangling un-redeemed coupons.
      for (const sel of selectedCoupons) {
        if (sel.amount > 0) await applyCoupon(sel.coupon.id, ficheId, sel.amount);
      }

      await closeFiche(ficheId, salonId, payments);
      onClose();
      messagePopup.getState().success('Fiche chiusa con successo');
    } catch (err) {
      messagePopup.getState().error(err instanceof Error ? err.message : 'Errore durante la chiusura della fiche');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/50 focus:border-primary/50 transition-shadow';
  const readOnlyFieldClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-zinc-50 dark:bg-zinc-700/30 text-sm whitespace-pre-wrap min-h-[4.75rem]';
  const labelClass =
    'flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide';

  const isEdit = mode === 'edit';
  const isCompleted = fiche?.status === FicheStatus.COMPLETED;
  const paymentValid = isPaymentValid(paymentView, effectiveTotal, cashGiven, splits);

  const confirmText = activeTopTab === 'payment'
    ? (isSubmitting ? 'Chiusura…' : 'Conferma pagamento')
    : (isEdit ? (isSubmitting ? 'Salvataggio…' : 'Salva') : (isSubmitting ? 'Creazione…' : 'Aggiungi'));

  const onConfirm = activeTopTab === 'payment' ? handlePay : handleSubmit;
  const confirmDisabled = isSubmitting || (activeTopTab === 'payment' && !paymentValid);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <AddModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onConfirm}
        title={
          isEdit
            ? (activeTopTab === 'payment' ? 'Chiudi fiche' : 'Modifica fiche')
            : 'Nuova fiche'
        }
        subtitle={
          isEdit
            ? (activeTopTab === 'payment' ? 'Incassa e chiudi la fiche' : "Aggiorna i dettagli dell'appuntamento")
            : 'Crea un nuovo appuntamento'
        }
        icon={
          isEdit
            ? (activeTopTab === 'payment' ? ReceiptText : Pencil)
            : Plus
        }
        classes="max-w-7xl w-[95vw] h-[92vh]"
        confirmText={confirmText}
        confirmDisabled={confirmDisabled}
        footerContent={
          <div className="flex items-center gap-5">
            <div className="flex flex-col gap-0.5">
              <span className={`text-xs ${hasOverride ? 'text-zinc-400 line-through' : 'text-zinc-500'}`}>
                Subtotale: € {subtotal.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-500">Durata: {totalDuration} min</span>
            </div>
            {isEdit && (
              <div className="flex flex-col gap-1">
                <label className="text-2xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Totale finale (€)
                </label>
                <div className="flex items-center gap-1.5">
                  <CustomNumberInput
                    value={totalOverride}
                    onChange={(v) => setTotalOverride(v)}
                    min={0}
                    step={0.5}
                    decimals={2}
                    placeholder={subtotal.toFixed(2)}
                    suffix="€"
                    size="md"
                    width="w-32"
                  />
                  {totalOverride !== null && (
                    <button
                      type="button"
                      onClick={() => setTotalOverride(null)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
                      title="Rimuovi sconto"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        }
        dangerAction={
          isEdit ? (
            <>
              {activeTopTab === 'edit' && !isCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateForm()) return;
                    setActiveTopTab('payment');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  <ReceiptText className="size-4" />
                  Procedi al pagamento
                </button>
              )}
              {activeTopTab === 'payment' && (
                <button
                  type="button"
                  onClick={() => setActiveTopTab('edit')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  Torna alla modifica
                </button>
              )}
              {activeTopTab === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="size-4" />
                  Elimina
                </button>
              )}
            </>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-4 h-full min-h-0">

          {activeTopTab === 'edit' ? (
            /* ══ MODIFICA TAB ═══════════════════════════════════════════════ */
            <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 2xl:gap-8 flex-1 min-h-0 overflow-y-auto 2xl:overflow-visible">

              {/* ── LEFT: Dettagli ── */}
              <div className="flex flex-col gap-5 2xl:overflow-y-auto 2xl:pr-1">

                {/* Row 1: Data, Cliente, Stato — 3-col below 2xl when there's room, stacked at 2xl (narrow column) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-1 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}><Calendar className="size-3.5" />Data e ora *</label>
                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={datetimeStr}
                      onChange={(e) => setDatetimeStr(e.target.value)}
                    />
                    {errors.datetime && <p className="mt-0.5 text-xs text-red-500">{errors.datetime}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}><User className="size-3.5" />Cliente *</label>
                    <CustomSelect
                      options={clientOptions}
                      labelKey="fullName"
                      valueKey="id"
                      value={clientId}
                      onChange={setClientId}
                      placeholder="Cerca cliente…"
                      maxHeight="max-h-48"
                    />
                    {errors.client_id && <p className="mt-0.5 text-xs text-red-500">{errors.client_id}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}><Check className="size-3.5" />Stato</label>
                    <select
                      className={inputClass}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as FicheStatus)}
                    >
                      <option value={FicheStatus.CREATED}>Creata</option>
                      <option value={FicheStatus.PENDING}>In attesa</option>
                      <option value={FicheStatus.COMPLETED}>Completata</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
                    {([
                      { id: 'new', label: 'Scheda tecnica' },
                      { id: 'last', label: 'Ultima scheda' },
                    ] as { id: 'new' | 'last'; label: string }[]).map(({ id, label }) => {
                      const isActive = treatmentTab === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTreatmentTab(id)}
                          className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            isActive
                              ? 'border-primary text-zinc-900 dark:text-zinc-100'
                              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {treatmentTab === 'new' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-1 gap-3 pt-1">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}><FlaskConical className="size-3.5" />Miscela</label>
                        <textarea
                          className={`${inputClass} resize-none`}
                          rows={3}
                          value={miscela}
                          onChange={(e) => setMiscela(e.target.value)}
                          placeholder="Codice colore…"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}><Sparkles className="size-3.5" />Tecnica</label>
                        <textarea
                          className={`${inputClass} resize-none`}
                          rows={3}
                          value={tecnica}
                          onChange={(e) => setTecnica(e.target.value)}
                          placeholder="Es. balayage…"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}><FileText className="size-3.5" />Nota appuntamento</label>
                        <textarea
                          className={`${inputClass} resize-none`}
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Note per questo appuntamento…"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 pt-1">
                      {lastTreatment && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {format(new Date(lastTreatment.datetime), "d MMMM yyyy", { locale: it })}
                        </p>
                      )}
                      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-1 gap-3">
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
                            <div key={field} className="flex flex-col gap-1.5">
                              <label className={labelClass}><Icon className="size-3.5" />{config.label}</label>
                              <div
                                className={`${readOnlyFieldClass} ${value ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}`}
                              >
                                {value || placeholder}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* ── RIGHT: Servizi / Prodotti ── */}
              <div className="flex flex-col gap-4 min-h-0">

                {/* Tab switcher (nested) */}
                <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                    {([
                      { id: 'services', label: 'Servizi', icon: Scissors, count: ficheServices.length },
                      { id: 'products', label: 'Prodotti', icon: Package, count: ficheProducts.length },
                    ] as { id: 'services' | 'products'; label: string; icon: React.ElementType; count: number }[]).map(({ id, label, icon: Icon, count }) => {
                      const isActive = activeTab === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveTab(id)}
                          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            isActive
                              ? 'border-primary text-primary-hover dark:text-primary/70'
                              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                          }`}
                        >
                          <Icon className="size-4" />
                          {label}
                          {count > 0 && (
                            <NumberBadge value={count} variant={isActive ? 'primary' : 'neutral'} size="md" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── SERVICES TAB ── */}
                  {activeTab === 'services' && (
                    <>
                      <div ref={svcDropdownRef} className="relative shrink-0">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                          <input
                            ref={svcInputRef}
                            type="text"
                            className={`${inputClass} pl-8`}
                            placeholder="Cerca e aggiungi servizi…"
                            value={svcQuery}
                            onChange={(e) => { setSvcQuery(e.target.value); setSvcOpen(true); }}
                            onFocus={() => setSvcOpen(true)}
                          />
                        </div>

                        {svcOpen && (
                          <div className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-xl z-100 overflow-hidden">
                            <CategoryDropdown
                              groups={groupedServices}
                              query={svcQuery}
                              onSelect={addServiceToList}
                              getKey={(s) => s.id}
                              emptyText="Nessun servizio trovato"
                              renderItem={(svc) => (
                                <>
                                  <span className="text-zinc-900 dark:text-zinc-100 truncate">{svc.name}</span>
                                  <div className="flex items-center gap-2.5 text-xs text-zinc-400 shrink-0">
                                    <span className="flex items-center gap-1"><Clock className="size-3" />{svc.duration} min</span>
                                    <span className="flex items-center gap-1"><Euro className="size-3" />{svc.price.toFixed(2)}</span>
                                  </div>
                                </>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {errors.services && <p className="text-xs text-red-500 -mt-2">{errors.services}</p>}

                      <div className="flex flex-col rounded-lg border border-zinc-500/25 2xl:flex-1 2xl:min-h-0">
                        {ficheServices.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                            <Scissors className="size-8 opacity-20" />
                            <p className="text-sm">Nessun servizio aggiunto</p>
                            <p className="text-xs opacity-60">Cerca e clicca per aggiungere</p>
                          </div>
                        ) : (
                          <>
                            <div
                              className="grid items-center px-3 py-2 bg-zinc-50 dark:bg-zinc-700/40 border-b border-zinc-500/15 text-xs font-medium text-zinc-400 uppercase tracking-wide shrink-0 rounded-t-lg"
                              style={{ gridTemplateColumns: TABLE_COLS }}
                            >
                              <span className="flex items-center gap-1"><Scissors className="size-3" />Servizio</span>
                              <span className="flex items-center gap-1"><User className="size-3" />Operatore</span>
                              <span className="flex items-center gap-1 justify-center"><Clock className="size-3" />Min</span>
                              <span className="text-center">Inizio</span>
                              <span className="text-center">Fine</span>
                              <span className="flex items-center gap-1 justify-end"><Euro className="size-3" />Prezzo</span>
                              <span />
                              <span className="text-center">Abb.</span>
                              <span />
                            </div>

                            <div className="divide-y divide-zinc-500/10 2xl:overflow-y-auto 2xl:overscroll-contain">
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
                                        <input
                                          type="text"
                                          value={svc.name}
                                          onChange={(e) => updateServiceName(i, e.target.value)}
                                          className="w-full min-w-0 px-2 py-1 rounded-md border border-transparent hover:border-zinc-500/25 focus:border-primary/50 focus:ring-2 focus:ring-inset focus:ring-primary/50 focus:outline-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 transition-colors"
                                          aria-label="Nome servizio"
                                        />
                                        {isOverridden && (
                                          <button
                                            type="button"
                                            onClick={() => resetServiceName(i)}
                                            className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                            title="Ripristina nome originale"
                                            aria-label="Ripristina nome originale"
                                          >
                                            <RotateCcw className="size-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  <div className="pr-2">
                                    <CustomSelect
                                      options={operatorOptions}
                                      labelKey="fullName"
                                      valueKey="id"
                                      value={svc.operator_id}
                                      onChange={(v) => updateServiceOperator(i, v)}
                                      placeholder="—"
                                      maxHeight="max-h-40"
                                      classes="text-sm"
                                    />
                                  </div>

                                  <div className="flex justify-center">
                                    <CustomNumberInput
                                      value={svc.duration}
                                      onChange={(v) => updateServiceDuration(i, v ?? 5)}
                                      min={5}
                                      step={5}
                                      size="lg"
                                    />
                                  </div>

                                  <span className="text-sm text-center font-mono text-zinc-600 dark:text-zinc-400">
                                    {format(svc.start_time, 'HH:mm', { locale: it })}
                                  </span>
                                  <span className="text-sm text-center font-mono text-zinc-600 dark:text-zinc-400">
                                    {format(svc.end_time, 'HH:mm', { locale: it })}
                                  </span>

                                  <div className="flex justify-end">
                                    <CustomNumberInput
                                      value={svc.final_price}
                                      onChange={(v) => updateServicePrice(i, v ?? 0)}
                                      min={0}
                                      step={0.5}
                                      decimals={2}
                                      suffix="€"
                                      size="lg"
                                      disabled={!!svc.abbonamento_id}
                                    />
                                  </div>

                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => updateServicePrice(i, svc.final_price === 0 ? svc.list_price : 0)}
                                      disabled={!!svc.abbonamento_id}
                                      aria-pressed={svc.final_price === 0}
                                      className={`p-1 rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                        svc.final_price === 0
                                          ? 'text-pink-500 bg-pink-50 dark:bg-pink-500/10'
                                          : 'text-zinc-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10'
                                      }`}
                                      title={svc.final_price === 0 ? 'Omaggio attivo (clicca per ripristinare)' : 'Segna come omaggio'}
                                      aria-label="Segna come omaggio"
                                    >
                                      <Gift className="size-3.5" />
                                    </button>
                                  </div>

                                  <AbbonamentoCell
                                    clientId={clientId}
                                    serviceId={svc.service_id}
                                    currentAbbonamentoId={svc.abbonamento_id}
                                    otherDraftAssignments={abbonamentoDraftCounts(ficheServices, i)}
                                    onChange={(id) => setServiceAbbonamento(i, id)}
                                  />

                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => removeService(i)}
                                      className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                      aria-label="Rimuovi servizio"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
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
                      <div ref={prodDropdownRef} className="relative shrink-0">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                          <input
                            ref={prodInputRef}
                            type="text"
                            className={`${inputClass} pl-8`}
                            placeholder="Cerca e aggiungi prodotti…"
                            value={prodQuery}
                            onChange={(e) => { setProdQuery(e.target.value); setProdOpen(true); }}
                            onFocus={() => setProdOpen(true)}
                          />
                        </div>

                        {prodOpen && (
                          <div className="absolute w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-500/25 rounded-lg shadow-xl z-100 overflow-hidden">
                            <CategoryDropdown
                              groups={groupedProducts}
                              query={prodQuery}
                              onSelect={addProductToList}
                              getKey={(p) => p.id}
                              emptyText="Nessun prodotto trovato"
                              renderItem={(prod) => (
                                <>
                                  <span className="text-zinc-900 dark:text-zinc-100 truncate">{prod.name}</span>
                                  <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
                                    <Euro className="size-3" />{(prod.sell_price ?? prod.price).toFixed(2)}
                                  </span>
                                </>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col rounded-lg border border-zinc-500/25 2xl:flex-1 2xl:min-h-0">
                        {ficheProducts.length > 0 && (
                          <div className="flex items-center px-3 py-2 bg-zinc-50 dark:bg-zinc-700/40 border-b border-zinc-500/15 text-xs font-medium text-zinc-400 uppercase tracking-wide shrink-0 rounded-t-lg">
                            <span className="flex items-center gap-1 flex-1 min-w-0"><Package className="size-3" />Prodotto</span>
                            <span className="flex items-center gap-1 shrink-0 mr-4">Qtà</span>
                            <span className="flex items-center gap-1 shrink-0 mr-6"><Euro className="size-3" />Totale</span>
                            <span className="size-6" />
                          </div>
                        )}
                        {ficheProducts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                            <Package className="size-8 opacity-20" />
                            <p className="text-sm">Nessun prodotto aggiunto</p>
                            <p className="text-xs opacity-60">Cerca e clicca per aggiungere</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-500/10 2xl:overflow-y-auto 2xl:overscroll-contain">
                            {ficheProducts.map((prod) => (
                              <div key={prod.product_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{prod.name}</span>
                                  <span className="text-xs text-zinc-400 dark:text-zinc-500">{prod.list_price.toFixed(2)} € / pz</span>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => updateProductQuantity(prod.product_id, -1)}
                                      className="size-6 flex items-center justify-center rounded-md border border-zinc-500/25 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm leading-none"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      value={prod.quantity}
                                      size={Math.max(2, String(prod.quantity).length)}
                                      onChange={(e) => setProductQuantity(prod.product_id, e.target.value)}
                                      className="min-w-7 text-center text-sm font-mono text-zinc-700 dark:text-zinc-300 bg-transparent border border-zinc-500/25 rounded-md focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none py-0.5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateProductQuantity(prod.product_id, 1)}
                                      className="size-6 flex items-center justify-center rounded-md border border-zinc-500/25 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm leading-none"
                                    >
                                      +
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setProductFinalPrice(prod.product_id, prod.final_price === 0 ? String(prod.list_price * prod.quantity) : '0')}
                                      aria-pressed={prod.final_price === 0}
                                      className={`p-1 rounded-md transition-colors ${
                                        prod.final_price === 0
                                          ? 'text-pink-500 bg-pink-50 dark:bg-pink-500/10'
                                          : 'text-zinc-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10'
                                      }`}
                                      title={prod.final_price === 0 ? 'Omaggio attivo (clicca per ripristinare)' : 'Segna come omaggio'}
                                      aria-label="Segna come omaggio"
                                    >
                                      <Gift className="size-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      value={prod.final_price.toFixed(2)}
                                      size={Math.max(4, prod.final_price.toFixed(2).length)}
                                      onChange={(e) => setProductFinalPrice(prod.product_id, e.target.value)}
                                      className="min-w-12 text-right text-sm font-mono text-zinc-500 dark:text-zinc-400 bg-transparent border border-zinc-500/25 rounded-md focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none py-0.5 px-1.5"
                                    />
                                    <span className="text-sm text-zinc-400 dark:text-zinc-500">€</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeProduct(prod.product_id)}
                                    className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    aria-label="Rimuovi prodotto"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                {errorMessage && <p className="text-xs text-red-500 shrink-0">{errorMessage}</p>}
              </div>
            </div>
          ) : (
            /* ══ PAGAMENTO TAB ══════════════════════════════════════════════ */
            <div className="grid gap-8 flex-1 min-h-0" style={{ gridTemplateColumns: '320px 1fr' }}>
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
          mainIcon={AlertTriangle}
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sei sicuro di voler eliminare questa fiche? L&apos;azione è irreversibile.
          </p>
        </DeleteModal>
      )}

      <DeleteModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleSubmit}
        title="Fuori orari di lavoro"
        subtitle="L'appuntamento è fuori dagli orari configurati"
        mainIcon={AlertTriangle}
        confirmIcon={Check}
        confirmText="Conferma comunque"
      >
        {servicesWithTimes.length > 0 && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            L&apos;appuntamento è previsto dalle{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {format(servicesWithTimes[0].start_time, 'HH:mm', { locale: it })}
            </span>{' '}
            alle{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {format(servicesWithTimes[servicesWithTimes.length - 1].end_time, 'HH:mm', { locale: it })}
            </span>
            , fuori dagli orari di apertura del salone. Confermi di voler creare l&apos;appuntamento comunque?
          </p>
        )}
      </DeleteModal>
    </>
  );
}
