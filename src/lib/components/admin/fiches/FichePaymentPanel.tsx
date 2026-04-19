'use client';

import { CreditCard, Banknote, HelpCircle, Shuffle, Plus, Trash2 } from 'lucide-react';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';

export type PaymentView = FichePaymentMethod | 'mixed' | null;

export interface Split {
  method: FichePaymentMethod;
  amount: number | null;
}

const METHOD_LABELS: Record<FichePaymentMethod, string> = {
  [FichePaymentMethod.CASH]: 'Contanti',
  [FichePaymentMethod.POS]: 'POS',
  [FichePaymentMethod.OTHER]: 'Altro',
};

export const INITIAL_SPLITS: Split[] = [
  { method: FichePaymentMethod.POS, amount: null },
  { method: FichePaymentMethod.CASH, amount: null },
];

function fmt(value: number) {
  return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Build the payments array to hand to `closeFiche` given the current panel state. */
export function buildPayments(
  view: PaymentView,
  total: number,
  cashGiven: number | null,
  splits: Split[],
): { method: FichePaymentMethod; amount: number }[] | null {
  if (view === FichePaymentMethod.CASH) {
    if ((cashGiven ?? 0) < total) return null;
    return [{ method: FichePaymentMethod.CASH, amount: total }];
  }
  if (view === FichePaymentMethod.POS || view === FichePaymentMethod.OTHER) {
    return [{ method: view, amount: total }];
  }
  if (view === 'mixed') {
    const splitsSum = splits.reduce((sum, s) => sum + (s.amount ?? 0), 0);
    const splitsMatch = Math.round(splitsSum * 100) === Math.round(total * 100);
    const hasNegative = splits.some((s) => s.amount !== null && s.amount < 0);
    const allFilled = splits.every((s) => s.amount !== null);
    if (!splitsMatch || hasNegative || !allFilled) return null;
    return splits
      .filter((s) => s.amount !== null && s.amount >= 0)
      .map((s) => ({ method: s.method, amount: s.amount! }));
  }
  return null;
}

export function isPaymentValid(
  view: PaymentView,
  total: number,
  cashGiven: number | null,
  splits: Split[],
): boolean {
  return buildPayments(view, total, cashGiven, splits) !== null;
}

interface FichePaymentPanelProps {
  total: number;
  view: PaymentView;
  onViewChange: (v: PaymentView) => void;
  cashGiven: number | null;
  onCashGivenChange: (v: number | null) => void;
  splits: Split[];
  onSplitsChange: (s: Split[]) => void;
}

export function FichePaymentPanel({
  total,
  view,
  onViewChange,
  cashGiven,
  onCashGivenChange,
  splits,
  onSplitsChange,
}: FichePaymentPanelProps) {
  const cashGivenNum = cashGiven ?? 0;
  const isShortfall = cashGivenNum < total;
  const changeDisplay = isShortfall ? total - cashGivenNum : cashGivenNum - total;

  const splitsSum = splits.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const splitsMatch = Math.round(splitsSum * 100) === Math.round(total * 100);

  const updateSplitMethod = (index: number, value: string) => {
    onSplitsChange(splits.map((s, i) => (i === index ? { ...s, method: value as FichePaymentMethod } : s)));
  };

  const updateSplitAmount = (index: number, value: number | null) => {
    onSplitsChange(splits.map((s, i) => (i === index ? { ...s, amount: value } : s)));
  };

  const addSplit = () => {
    onSplitsChange([...splits, { method: FichePaymentMethod.CASH, amount: null }]);
  };

  const removeSplit = (index: number) => {
    onSplitsChange(splits.filter((_, i) => i !== index));
  };

  return (
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
              type="button"
              onClick={() => onViewChange(key)}
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

      <div className="min-h-[100px]">
        {view === FichePaymentMethod.CASH && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Soldi ricevuti (€)
              </label>
              <CustomNumberInput
                value={cashGiven}
                onChange={(v) => onCashGivenChange(v)}
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
                  type="button"
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
              type="button"
              onClick={addSplit}
              className="flex items-center gap-1.5 text-xs text-primary-hover dark:text-primary/70 hover:text-primary-active dark:hover:text-primary/40 transition-colors self-start"
            >
              <Plus className="size-3.5" />
              Aggiungi pagamento
            </button>

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
  );
}
