'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Check, CreditCard, Banknote, HelpCircle, Shuffle, Plus, Trash2, Scissors, Package, Lightbulb } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { useFichesStore } from '@/lib/stores/fiches';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import type { Fiche } from '@/lib/types/Fiche';
import type { FicheProduct } from '@/lib/types/FicheProduct';

type PaymentView = FichePaymentMethod | 'mixed' | null;

interface Split {
  method: FichePaymentMethod;
  amount: number | null;
}

interface CheckoutFicheModalProps {
  isOpen: boolean;
  onClose: () => void;
  fiche: Fiche | null;
}

const METHOD_LABELS: Record<FichePaymentMethod, string> = {
  [FichePaymentMethod.CASH]: 'Contanti',
  [FichePaymentMethod.POS]: 'POS',
  [FichePaymentMethod.OTHER]: 'Altro',
};

const INITIAL_SPLITS: Split[] = [
  { method: FichePaymentMethod.POS, amount: null },
  { method: FichePaymentMethod.CASH, amount: null },
];

function fmt(value: number) {
  return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Torn-paper zigzag helpers ──────────────────────────────────────────────

function makeZigzag(w: number, h: number, step: number, kind: 'top' | 'bottom'): string {
  const pts: string[] = [];
  if (kind === 'bottom') {
    pts.push(`M0,0 L0,${h}`);
    for (let x = 0; x < w; x += step) {
      pts.push(`L${x + step / 2},0 L${x + step},${h}`);
    }
    pts.push(`L${w},0 Z`);
  } else {
    pts.push(`M0,${h} L0,0`);
    for (let x = 0; x < w; x += step) {
      pts.push(`L${x + step / 2},${h} L${x + step},0`);
    }
    pts.push(`L${w},${h} Z`);
  }
  return pts.join(' ');
}

// Pre-computed at module level — never changes
const TOP_ZIGZAG = makeZigzag(100, 8, 5, 'top');
const BOTTOM_ZIGZAG = makeZigzag(100, 8, 5, 'bottom');

function TornEdge({ kind }: { kind: 'top' | 'bottom' }) {
  return (
    <svg
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      className="block w-full h-2 fill-current"
      aria-hidden="true"
    >
      <path d={kind === 'top' ? TOP_ZIGZAG : BOTTOM_ZIGZAG} />
    </svg>
  );
}

// ── Main checkout component ────────────────────────────────────────────────

// Stateful inner component — keyed by fiche.id so React resets all state on each open
function CheckoutContent({ fiche, onClose }: { fiche: Fiche; onClose: () => void }) {
  const closeFiche = useFichesStore((s) => s.closeFiche);
  const salonName = useSubscriptionStore((s) => s.salonName) || 'Il tuo salone';

  const [view, setView] = useState<PaymentView>(FichePaymentMethod.CASH);
  const [cashGiven, setCashGiven] = useState<number | null>(null);
  const [splits, setSplits] = useState<Split[]>(INITIAL_SPLITS.map((s) => ({ ...s })));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = fiche.getTotal();
  const client = fiche.getClient();
  const clientName = client?.getFullName() ?? 'Cliente sconosciuto';

  const ficheServices = fiche.getFicheServices();
  const ficheProducts: FicheProduct[] = fiche.getFicheProducts();
  const services = useServicesStore((s) => s.services);
  const products = useProductsStore((s) => s.products);
  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Cash view — fixed change/shortfall logic
  const cashGivenNum = cashGiven ?? 0;
  const isShortfall = cashGivenNum < total;
  const changeDisplay = isShortfall ? total - cashGivenNum : cashGivenNum - total;

  // Mixed view
  const splitsSum = splits.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const splitsMatch = Math.round(splitsSum * 100) === Math.round(total * 100);
  const splitsHaveNegative = splits.some((s) => s.amount !== null && s.amount < 0);
  const mixedValid =
    splitsMatch &&
    !splitsHaveNegative &&
    splits.every((s) => s.amount !== null);

  const handleSubmit = useCallback(async () => {
    if (!view || isSubmitting) return;

    let payments: { method: FichePaymentMethod; amount: number }[] = [];

    if (view === FichePaymentMethod.CASH) {
      payments = [{ method: FichePaymentMethod.CASH, amount: total }];
    } else if (view === FichePaymentMethod.POS || view === FichePaymentMethod.OTHER) {
      payments = [{ method: view, amount: total }];
    } else if (view === 'mixed') {
      if (!mixedValid) return;
      payments = splits
        .filter((s) => s.amount !== null && s.amount >= 0)
        .map((s) => ({ method: s.method, amount: s.amount! }));
    }

    if (payments.length === 0) return;

    setIsSubmitting(true);
    try {
      await closeFiche(fiche.id, fiche.salon_id, payments);
      messagePopup.getState().success('Fiche chiusa con successo');
      onClose();
    } catch {
      messagePopup.getState().error('Errore durante la chiusura della fiche');
      setIsSubmitting(false);
    }
  }, [view, total, splits, mixedValid, isSubmitting, closeFiche, fiche.id, fiche.salon_id, onClose]);

  const updateSplitMethod = (index: number, value: string) => {
    setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, method: value as FichePaymentMethod } : s)));
  };

  const updateSplitAmount = (index: number, value: number | null) => {
    setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, amount: value } : s)));
  };

  const addSplit = () => {
    setSplits((prev) => [...prev, { method: FichePaymentMethod.CASH, amount: null }]);
  };

  const removeSplit = (index: number) => {
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = (() => {
    if (!view || isSubmitting) return false;
    if (view === FichePaymentMethod.CASH) return cashGivenNum >= total;
    if (view === FichePaymentMethod.POS || view === FichePaymentMethod.OTHER) return true;
    if (view === 'mixed') return mixedValid;
    return false;
  })();

  return (
    <div className="flex flex-col bg-zinc-50 dark:bg-zinc-800 rounded-lg shadow-xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-5 border-b border-zinc-500/25 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-primary/10">
            <CreditCard className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Chiudi Fiche</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]">{clientName}</p>
          </div>
        </div>
        <button
          aria-label="Chiudi"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 2xl:grid-cols-[320px_1fr] gap-6 2xl:gap-8 p-4 2xl:p-6">

        {/* ── LEFT: Receipt with torn-paper effect ── */}
        {/* text-zinc-50/zinc-800 sets currentColor for the SVG fill to match modal bg */}
        <div
          className="text-receipt"
          style={{ filter: 'drop-shadow(0 4px 20px rgb(0 0 0 / 0.13))' }}
        >
          <TornEdge kind="top" />

          <div className="bg-receipt font-mono text-sm">
            {/* Salon name */}
            <div className="px-5 pt-5 pb-4 text-center">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-tight">
                {salonName}
              </p>
              <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                {' · '}
                {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Client + receipt ID */}
            <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3 font-sans grid grid-cols-2 gap-x-2">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Cliente</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 truncate">{clientName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">N. scontrino</p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono">{fiche.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            {/* Services */}
            {ficheServices.length > 0 && (
              <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Scissors className="size-3 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Servizi</span>
                </div>
                {ficheServices.map((fs) => {
                  const service = serviceMap.get(fs.service_id);
                  const isDiscounted = fs.final_price < fs.list_price;
                  return (
                    <div key={fs.id} className="flex items-baseline justify-between gap-2 py-0.5">
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-sans">{fs.name || service?.name || 'Servizio'}</span>
                      <span className="flex items-baseline gap-1.5 shrink-0">
                        {isDiscounted && (
                          <span className="text-2xs text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(fs.list_price)}</span>
                        )}
                        <span className={`text-xs font-medium shrink-0 ${isDiscounted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          € {fmt(fs.final_price)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Products */}
            {ficheProducts.length > 0 && (
              <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className="size-3 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Prodotti</span>
                </div>
                {ficheProducts.map((fp) => {
                  const product = productMap.get(fp.product_id);
                  const listTotal = fp.list_price * fp.quantity;
                  const finalTotal = fp.final_price * fp.quantity;
                  const isDiscounted = fp.final_price < fp.list_price;
                  return (
                    <div key={fp.id} className="flex items-baseline justify-between gap-2 py-0.5">
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-sans">
                        {product?.name ?? 'Prodotto'}
                        {fp.quantity > 1 && (
                          <span className="text-zinc-400 dark:text-zinc-500 ml-1">×{fp.quantity}</span>
                        )}
                      </span>
                      <span className="flex items-baseline gap-1.5 shrink-0">
                        {isDiscounted && (
                          <span className="text-2xs text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(listTotal)}</span>
                        )}
                        <span className={`text-xs font-medium shrink-0 ${isDiscounted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          € {fmt(finalTotal)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total */}
            <div className="mx-4 border-t border-zinc-200 dark:border-zinc-700 pt-3 pb-3 flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-sans">Totale</span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">€ {fmt(total)}</span>
            </div>

            {/* Lume branding footer */}
            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 py-3 flex items-center justify-center gap-1.5 font-sans">
              <Lightbulb className="size-3 text-primary" strokeWidth={2.25} />
              <span className="text-2xs text-zinc-400 dark:text-zinc-500">
                Gestito con <span className="text-primary font-semibold">Lume.</span>
              </span>
            </div>
          </div>

          <TornEdge kind="bottom" />
        </div>

        {/* ── RIGHT: Payment method + actions ── */}
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Metodo di pagamento
            </p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { key: FichePaymentMethod.CASH, label: 'Contanti', Icon: Banknote },
                  { key: FichePaymentMethod.POS, label: 'POS', Icon: CreditCard },
                  { key: FichePaymentMethod.OTHER, label: 'Altro', Icon: HelpCircle },
                  { key: 'mixed' as const, label: 'Misto', Icon: Shuffle },
                ] as { key: PaymentView; label: string; Icon: React.FC<{ className?: string }> }[]
              ).map(({ key, label, Icon }) => (
                <button
                  key={key ?? 'null'}
                  onClick={() => setView(key)}
                  className={[
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-xs font-medium transition-all',
                    view === key
                      ? 'border-primary bg-primary/10 dark:bg-primary/10 text-primary-hover dark:text-primary/70 ring-1 ring-primary'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600',
                  ].join(' ')}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic view */}
          <div className="min-h-[100px]">
            {/* View A: Contanti */}
            {view === FichePaymentMethod.CASH && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Soldi ricevuti (€)
                  </label>
                  <CustomNumberInput
                    value={cashGiven}
                    onChange={(v) => setCashGiven(v)}
                    min={0}
                    step={0.5}
                    decimals={2}
                    placeholder="0,00"
                    suffix="€"
                    size="md"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900/60">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {isShortfall ? 'Mancano' : 'Resto'}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      isShortfall ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    € {fmt(changeDisplay)}
                  </span>
                </div>
              </div>
            )}

            {/* View B: POS / Altro */}
            {(view === FichePaymentMethod.POS || view === FichePaymentMethod.OTHER) && (
              <div className="flex items-center justify-center pt-2">
                <div className="text-center p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900/60 w-full">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Pagamento di{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">€ {fmt(total)}</span>{' '}
                    tramite{' '}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{METHOD_LABELS[view]}</span>
                  </p>
                </div>
              </div>
            )}

            {/* View C: Misto */}
            {view === 'mixed' && (
              <div className="flex flex-col gap-3">
                {splits.map((split, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={split.method}
                      onChange={(e) => updateSplitMethod(i, e.target.value)}
                      className="flex-1 px-2.5 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-900
                        border-zinc-200 dark:border-zinc-700
                        focus:border-primary/70 dark:focus:border-primary
                        text-zinc-900 dark:text-zinc-100 outline-none transition-colors"
                    >
                      <option value={FichePaymentMethod.CASH}>Contanti</option>
                      <option value={FichePaymentMethod.POS}>POS</option>
                      <option value={FichePaymentMethod.OTHER}>Altro</option>
                    </select>
                    <CustomNumberInput
                      value={split.amount}
                      onChange={(v) => updateSplitAmount(i, v)}
                      min={0}
                      step={0.5}
                      decimals={2}
                      placeholder="0,00"
                      suffix="€"
                      size="sm"
                      width="w-28"
                    />
                    <button
                      onClick={() => removeSplit(i)}
                      disabled={splits.length <= 2}
                      className="p-1.5 rounded text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Rimuovi"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addSplit}
                  className="flex items-center gap-1.5 text-xs text-primary-hover dark:text-primary/70 hover:text-primary-active dark:hover:text-primary/40 transition-colors self-start"
                >
                  <Plus className="size-3.5" />
                  Aggiungi pagamento
                </button>

                {/* Running total */}
                <div
                  className={`flex items-center justify-between p-3 rounded-lg mt-1 ${
                    splitsMatch
                      ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : 'bg-zinc-100 dark:bg-zinc-900/60'
                  }`}
                >
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Inserito</span>
                  <span
                    className={`text-sm font-semibold ${
                      splitsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    € {fmt(splitsSum)} / € {fmt(total)}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer — action buttons spanning full modal width */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-500/25 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg
            bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600
            transition-all text-zinc-900 dark:text-zinc-100"
        >
          <X className="size-4" />
          Annulla
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-thin rounded-lg
            bg-primary text-white hover:bg-primary-hover
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all"
        >
          <Check className="size-4" />
          {isSubmitting ? 'Chiusura...' : 'Conferma e Chiudi'}
        </button>
      </div>
    </div>
  );
}

export function CheckoutFicheModal({ isOpen, onClose, fiche }: CheckoutFicheModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-4xl w-full">
      {fiche && <CheckoutContent key={fiche.id} fiche={fiche} onClose={onClose} />}
    </Modal>
  );
}
