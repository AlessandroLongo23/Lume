'use client';

import { useState, useCallback } from 'react';
import { X, Check, CreditCard, Banknote, HelpCircle, Shuffle, Plus, Trash2, Scissors, Package, Lightbulb } from 'lucide-react';
import { Modal } from '@/lib/components/shared/ui/modals/Modal';
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
  amount: string;
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
  { method: FichePaymentMethod.POS, amount: '' },
  { method: FichePaymentMethod.CASH, amount: '' },
];

function fmt(value: number) {
  return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Stateful inner component — keyed by fiche.id so React resets all state on each open
function CheckoutContent({ fiche, onClose }: { fiche: Fiche; onClose: () => void }) {
  const closeFiche = useFichesStore((s) => s.closeFiche);
  const salonName = useSubscriptionStore((s) => s.salonName) || 'Il tuo salone';

  const [view, setView] = useState<PaymentView>(FichePaymentMethod.CASH);
  const [cashGiven, setCashGiven] = useState('');
  const [splits, setSplits] = useState<Split[]>(INITIAL_SPLITS.map((s) => ({ ...s })));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = fiche.getTotal();
  const client = fiche.getClient();
  const clientName = client?.getFullName() ?? 'Cliente sconosciuto';

  const ficheServices = fiche.getFicheServices();
  const ficheProducts: FicheProduct[] = fiche.getFicheProducts();
  const services = useServicesStore((s) => s.services);
  const products = useProductsStore((s) => s.products);

  // Cash view
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const change = cashGivenNum - total;

  // Mixed view
  const splitsSum = splits.reduce((sum, s) => {
    const v = parseFloat(s.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const splitsMatch = Math.round(splitsSum * 100) === Math.round(total * 100);
  const splitsHaveNegative = splits.some((s) => {
    const v = parseFloat(s.amount);
    return !isNaN(v) && v < 0;
  });
  const mixedValid =
    splitsMatch &&
    !splitsHaveNegative &&
    splits.every((s) => s.amount.trim() !== '');

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
        .filter((s) => s.amount.trim() !== '')
        .map((s) => ({ method: s.method, amount: parseFloat(s.amount) }))
        .filter((p) => p.amount >= 0);
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

  const updateSplit = (index: number, field: keyof Split, value: string) => {
    setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSplit = () => {
    setSplits((prev) => [...prev, { method: FichePaymentMethod.CASH, amount: '' }]);
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
      <div className="flex items-center justify-between p-6 border-b border-zinc-500/25 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 items-center justify-center size-10 rounded-lg bg-indigo-500/10">
            <CreditCard className="size-5 text-indigo-500" />
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

      {/* Receipt */}
      <div className="mx-6 my-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-[#FAFAF8] dark:bg-zinc-950 overflow-hidden font-mono text-sm shadow-sm">

        {/* Salon name */}
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-tight">
            {salonName}
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
            {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}
            {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Client + receipt ID row */}
        <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3 font-sans grid grid-cols-2 gap-x-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Cliente</p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 truncate">{clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">N. scontrino</p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono">{fiche.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Services */}
        {ficheServices.length > 0 && (
          <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Scissors className="size-3 text-zinc-400 dark:text-zinc-500" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Servizi</span>
            </div>
            {ficheServices.map((fs) => {
              const service = services.find((s) => s.id === fs.service_id);
              const isDiscounted = fs.final_price < fs.list_price;
              return (
                <div key={fs.id} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-sans">{service?.name ?? 'Servizio'}</span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {isDiscounted && (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(fs.list_price)}</span>
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
              <span className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Prodotti</span>
            </div>
            {ficheProducts.map((fp) => {
              const product = products.find((p) => p.id === fp.product_id);
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
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(listTotal)}</span>
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-sans">Totale</span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">€ {fmt(total)}</span>
        </div>

        {/* Lume branding footer */}
        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 py-3 flex items-center justify-center gap-1.5 font-sans">
          <Lightbulb className="size-3 text-indigo-500" strokeWidth={2.25} />
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Gestito con <span className="text-indigo-500 font-semibold">Lume.</span>
          </span>
        </div>
      </div>

      {/* Method selector */}
      <div className="px-6 pt-5 pb-3">
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
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500'
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
      <div className="px-6 pb-4 min-h-[100px]">
        {/* View A: Contanti */}
        {view === FichePaymentMethod.CASH && (
          <div className="flex flex-col gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Soldi ricevuti (€)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-900
                  border-zinc-200 dark:border-zinc-700
                  focus:border-indigo-400 dark:focus:border-indigo-500
                  text-zinc-900 dark:text-zinc-100
                  placeholder:text-zinc-400 outline-none transition-colors"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900/60">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Resto</span>
              <span
                className={`text-lg font-bold ${
                  change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                € {fmt(change)}
              </span>
            </div>
          </div>
        )}

        {/* View B: POS / Altro */}
        {(view === FichePaymentMethod.POS || view === FichePaymentMethod.OTHER) && (
          <div className="flex items-center justify-center pt-4">
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
          <div className="flex flex-col gap-3 pt-2">
            {splits.map((split, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={split.method}
                  onChange={(e) => updateSplit(i, 'method', e.target.value)}
                  className="flex-1 px-2.5 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-900
                    border-zinc-200 dark:border-zinc-700
                    focus:border-indigo-400 dark:focus:border-indigo-500
                    text-zinc-900 dark:text-zinc-100 outline-none transition-colors"
                >
                  <option value={FichePaymentMethod.CASH}>Contanti</option>
                  <option value={FichePaymentMethod.POS}>POS</option>
                  <option value={FichePaymentMethod.OTHER}>Altro</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={split.amount}
                  onChange={(e) => {
                    const v = e.target.value;
                    // Block negative input at the JS level as well
                    if (v === '' || parseFloat(v) >= 0) updateSplit(i, 'amount', v);
                  }}
                  placeholder="0,00"
                  className="w-28 px-2.5 py-2 text-sm border rounded-lg bg-white dark:bg-zinc-900
                    border-zinc-200 dark:border-zinc-700
                    focus:border-indigo-400 dark:focus:border-indigo-500
                    text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 outline-none transition-colors"
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
              className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors self-start"
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

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-500/25 shrink-0">
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
            bg-indigo-500 text-white hover:bg-indigo-600
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
    <Modal isOpen={isOpen} onClose={onClose} classes="max-w-lg w-full">
      {fiche && <CheckoutContent key={fiche.id} fiche={fiche} onClose={onClose} />}
    </Modal>
  );
}
