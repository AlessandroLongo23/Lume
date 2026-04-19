'use client';

import { useState, useEffect, useMemo } from 'react';
import { Hash, Percent, Wallet, Banknote, CreditCard, Landmark, Calendar, FileText, ShieldCheck, ShieldOff } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { EditModal } from '@/lib/components/shared/ui/modals/EditModal';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { ServicesMultiSelect } from './ServicesMultiSelect';
import { AbbonamentoUsageList } from './AbbonamentoUsageList';
import type { Abbonamento, AbbonamentoPaymentMethod, AbbonamentoPricingMode } from '@/lib/types/Abbonamento';

interface EditAbbonamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  abbonamento: Abbonamento | null;
}

export function EditAbbonamentoModal({ isOpen, onClose, abbonamento }: EditAbbonamentoModalProps) {
  const updateAbbonamento = useAbbonamentiStore((s) => s.updateAbbonamento);
  const services = useServicesStore((s) => s.services);

  const [scopeIds, setScopeIds] = useState<string[]>([]);
  const [totalTreatments, setTotalTreatments] = useState<number | null>(0);
  const [pricingMode, setPricingMode] = useState<AbbonamentoPricingMode>('percent');
  const [discountPercent, setDiscountPercent] = useState<number | null>(0);
  const [totalPaid, setTotalPaid] = useState<number | null>(0);
  const [paymentMethod, setPaymentMethod] = useState<AbbonamentoPaymentMethod>('cash');
  const [validFrom, setValidFrom] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !abbonamento) return;
    setScopeIds(abbonamento.scope_service_ids);
    setTotalTreatments(abbonamento.total_treatments);
    setPricingMode(abbonamento.pricing_mode);
    setDiscountPercent(abbonamento.discount_percent);
    setTotalPaid(abbonamento.total_paid);
    setPaymentMethod(abbonamento.sale_payment_method);
    setValidFrom(abbonamento.valid_from.slice(0, 10));
    setHasExpiry(!!abbonamento.valid_until);
    setValidUntil(abbonamento.valid_until?.slice(0, 10) ?? '');
    setIsActive(abbonamento.is_active);
    setNotes(abbonamento.notes ?? '');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen, abbonamento]);

  const usedCount = abbonamento?.usedTreatments ?? 0;

  const referenceListPrice = useMemo(() => {
    if (!totalTreatments || scopeIds.length === 0) return 0;
    const avg =
      scopeIds.map((id) => services.find((s) => s.id === id)?.price ?? 0).reduce((a, b) => a + b, 0) /
      scopeIds.length;
    return avg * totalTreatments;
  }, [scopeIds, totalTreatments, services]);

  const computedFromPercent = useMemo(() => {
    if (pricingMode !== 'percent' || discountPercent == null) return null;
    return Math.max(0, referenceListPrice * (1 - discountPercent / 100));
  }, [pricingMode, discountPercent, referenceListPrice]);

  const effectiveTotalPaid = pricingMode === 'percent' ? (computedFromPercent ?? 0) : (totalPaid ?? 0);

  function validate(): string | null {
    if (scopeIds.length === 0) return 'Seleziona almeno un servizio';
    if (!totalTreatments || totalTreatments < 1) return 'Numero di sedute non valido';
    if (totalTreatments < usedCount) return `Non puoi portare il totale sotto le ${usedCount} sedute già utilizzate`;
    if (pricingMode === 'percent' && (discountPercent == null || discountPercent < 0 || discountPercent > 100)) {
      return 'Percentuale di sconto non valida (0–100)';
    }
    if (pricingMode === 'manual' && (totalPaid == null || totalPaid < 0)) return 'Importo incassato non valido';
    if (hasExpiry && new Date(validFrom) > new Date(validUntil)) {
      return 'La data di inizio deve precedere la scadenza';
    }
    return null;
  }

  async function handleSubmit() {
    if (!abbonamento) return;
    const err = validate();
    if (err) { setErrorMessage(err); return; }
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await updateAbbonamento(abbonamento.id, {
        scope_service_ids: scopeIds,
        total_treatments: totalTreatments!,
        pricing_mode: pricingMode,
        discount_percent: pricingMode === 'percent' ? discountPercent : null,
        total_paid: effectiveTotalPaid,
        sale_payment_method: paymentMethod,
        valid_from: validFrom,
        valid_until: hasExpiry ? validUntil : null,
        is_active: isActive,
        notes: notes.trim() || null,
      });
      messagePopup.getState().success('Abbonamento aggiornato.');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      setErrorMessage(msg);
      messagePopup.getState().error("Errore durante l'aggiornamento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50';
  const labelClass =
    'flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide';

  if (!abbonamento) return null;

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Modifica abbonamento"
      subtitle={`Sedute rimanenti: ${abbonamento.remainingTreatments} / ${abbonamento.total_treatments}`}
      classes="max-w-2xl"
      contentClasses="overflow-y-auto max-h-[70vh]"
      confirmText={isSubmitting ? 'Salvataggio…' : 'Salva modifiche'}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-md border border-zinc-500/15 px-3 py-2">
          <div className="flex items-center gap-2">
            {isActive ? (
              <ShieldCheck className="size-4 text-emerald-500" />
            ) : (
              <ShieldOff className="size-4 text-zinc-400" />
            )}
            <span className="text-sm">{isActive ? 'Abbonamento attivo' : 'Abbonamento disattivato'}</span>
          </div>
          <Switch checked={isActive} onChange={() => setIsActive((v) => !v)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Servizi inclusi *</label>
          <ServicesMultiSelect selectedIds={scopeIds} onChange={setScopeIds} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}><Hash className="size-3.5" />Sedute totali *</label>
          <CustomNumberInput
            value={totalTreatments}
            onChange={setTotalTreatments}
            min={Math.max(1, usedCount)}
            step={1}
            decimals={0}
            size="lg"
            width="w-36"
          />
          {usedCount > 0 && (
            <p className="text-xs text-zinc-500">
              {usedCount} già utilizzate — minimo consentito: {usedCount}.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Prezzo *</label>
          <ToggleButton
            options={['percent', 'manual'] as AbbonamentoPricingMode[]}
            labels={['Sconto %', 'Totale manuale']}
            icons={[Percent, Wallet]}
            value={pricingMode}
            onChange={(v) => setPricingMode(v as AbbonamentoPricingMode)}
            className="w-full"
          />
          {pricingMode === 'percent' ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CustomNumberInput
                  value={discountPercent}
                  onChange={setDiscountPercent}
                  min={0} max={100} step={1} decimals={0}
                  suffix="%" size="lg" width="w-32"
                />
                <span className="text-xs text-zinc-400">di sconto sul listino</span>
              </div>
              {referenceListPrice > 0 && (
                <div className="flex flex-col gap-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 px-3 py-2 text-xs">
                  <span className="text-zinc-500">
                    Prezzo di listino: <span className="font-mono">€ {referenceListPrice.toFixed(2)}</span>
                  </span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                    Totale da incassare: <span className="font-mono">€ {(computedFromPercent ?? 0).toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CustomNumberInput
                value={totalPaid}
                onChange={setTotalPaid}
                min={0} step={1} decimals={2}
                suffix="€" size="lg" width="w-36"
              />
              <span className="text-xs text-zinc-400">totale incassato</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Metodo di pagamento *</label>
          <ToggleButton
            options={['cash', 'card', 'transfer'] as AbbonamentoPaymentMethod[]}
            labels={['Contanti', 'Carta', 'Bonifico']}
            icons={[Banknote, CreditCard, Landmark]}
            value={paymentMethod}
            onChange={(v) => setPaymentMethod(v as AbbonamentoPaymentMethod)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><Calendar className="size-3.5" />Valido dal *</label>
            <input
              type="date"
              className={inputClass}
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className={labelClass}><Calendar className="size-3.5" />Scadenza</label>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Imposta</span>
                <Switch checked={hasExpiry} onChange={() => setHasExpiry((v) => !v)} />
              </div>
            </div>
            <input
              type="date"
              className={`${inputClass} ${hasExpiry ? '' : 'opacity-40 pointer-events-none'}`}
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              disabled={!hasExpiry}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}><FileText className="size-3.5" />Note</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note interne (opzionali)…"
          />
        </div>

        <AbbonamentoUsageList abbonamento={abbonamento} />

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
    </EditModal>
  );
}
