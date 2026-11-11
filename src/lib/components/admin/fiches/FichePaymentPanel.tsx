'use client';

import { CreditCard, Banknote, HelpCircle, Shuffle, Plus, Trash2 } from 'lucide-react';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { Button } from '@/lib/components/shared/ui/Button';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';

const PAYMENT_VIEWS: { key: Exclude<PaymentView, null>; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: FichePaymentMethod.CASH, label: 'Contanti', Icon: Banknote },
  { key: FichePaymentMethod.POS, label: 'POS', Icon: CreditCard },
  { key: FichePaymentMethod.OTHER, label: 'Altro', Icon: HelpCircle },
  { key: 'mixed', label: 'Misto', Icon: Shuffle },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: FichePaymentMethod.CASH, label: 'Contanti' },
  { value: FichePaymentMethod.POS, label: 'POS' },
  { value: FichePaymentMethod.OTHER, label: 'Altro' },
];

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
      <div data-tour="fiche-payment-methods">
        <p className="text-xs font-medium text-[var(--lume-text-secondary)] mb-3">
          Metodo di pagamento
        </p>
        <ToggleButton
          options={PAYMENT_VIEWS.map((v) => v.key)}
          labels={PAYMENT_VIEWS.map((v) => v.label)}
          icons={PAYMENT_VIEWS.map((v) => v.Icon)}
          value={view}
          ariaLabel="Metodo di pagamento"
          onChange={(key: PaymentView) => {
            onViewChange(key);
            // Advances the "scegli il metodo" step of the incassa-fiche guide.
            emitTourEvent('fiche:payment-method-selected');
          }}
          className="w-full"
        />
      </div>

      <div className="min-h-25">
        {view === FichePaymentMethod.CASH && (
          <div data-tour="fiche-payment-cash" className="flex flex-col gap-3">
            <Field label="Soldi ricevuti (€)">
              {({ id }) => (
                <NumberInput
                  id={id}
                  value={cashGiven}
                  onChange={(v) => onCashGivenChange(v)}
                  min={0}
                  step={0.5}
                  decimals={2}
                  placeholder="0,00"
                  suffix="€"
                />
              )}
            </Field>
            <div className="flex items-center justify-between p-3 rounded-lg bg-hover">
              <span className="text-sm font-medium text-[var(--lume-text-secondary)]">
                {isShortfall ? 'Mancano' : 'Resto'}
              </span>
              <span
                className={`text-lg font-medium ${
                  isShortfall ? 'text-danger-strong' : 'text-success-strong'
                }`}
              >
                € {fmt(changeDisplay)}
              </span>
            </div>
          </div>
        )}

        {(view === FichePaymentMethod.POS || view === FichePaymentMethod.OTHER) && (
          <div className="flex items-center justify-center pt-2">
            <div className="text-center p-4 rounded-lg bg-hover w-full">
              <p className="text-sm text-[var(--lume-text-secondary)]">
                Pagamento di{' '}
                <span className="font-medium text-[var(--lume-text)]">€ {fmt(total)}</span>{' '}
                tramite{' '}
                <span className="font-medium text-[var(--lume-text)]">{METHOD_LABELS[view]}</span>
              </p>
            </div>
          </div>
        )}

        {view === 'mixed' && (
          <div className="flex flex-col gap-3">
            {splits.map((split, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={split.method}
                  onChange={(v) => updateSplitMethod(i, v as string)}
                  options={PAYMENT_METHOD_OPTIONS}
                  labelKey="label"
                  valueKey="value"
                  searchable={false}
                  size="sm"
                  className="flex-1"
                />
                <NumberInput
                  value={split.amount}
                  onChange={(v) => updateSplitAmount(i, v)}
                  min={0}
                  step={0.5}
                  decimals={2}
                  placeholder="0,00"
                  suffix="€"
                  size="sm"
                  className="w-28"
                />
                <Button
                  variant="ghost-destructive"
                  size="sm"
                  iconOnly
                  aria-label="Rimuovi"
                  onClick={() => removeSplit(i)}
                  disabled={splits.length <= 2}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              leadingIcon={Plus}
              onClick={addSplit}
              className="self-start"
            >
              Aggiungi pagamento
            </Button>

            <div
              className={`flex items-center justify-between p-3 rounded-lg mt-1 ${
                splitsMatch
                  ? 'bg-success-soft'
                  : 'bg-hover'
              }`}
            >
              <span className="text-sm font-medium text-[var(--lume-text-secondary)]">Inserito</span>
              <span
                className={`text-sm font-medium ${
                  splitsMatch ? 'text-success-strong' : 'text-[var(--lume-text)]'
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
