'use client';

import { useState, useEffect, useMemo } from 'react';
import { BadgePercent, User, Hash, Percent, Wallet, Banknote, CreditCard, Landmark, Calendar, FileText } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { ServicesMultiSelect } from './ServicesMultiSelect';
import type { AbbonamentoPaymentMethod, AbbonamentoPricingMode } from '@/lib/types/Abbonamento';

interface AddAbbonamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function AddAbbonamentoModal({ isOpen, onClose }: AddAbbonamentoModalProps) {
  const addAbbonamento = useAbbonamentiStore((s) => s.addAbbonamento);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);

  const [clientId, setClientId] = useState('');
  const [scopeIds, setScopeIds] = useState<string[]>([]);
  const [totalTreatments, setTotalTreatments] = useState<number | null>(5);
  const [pricingMode, setPricingMode] = useState<AbbonamentoPricingMode>('percent');
  const [discountPercent, setDiscountPercent] = useState<number | null>(10);
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<AbbonamentoPaymentMethod>('cash');
  const [validFrom, setValidFrom] = useState(todayISO());
  const [hasExpiry, setHasExpiry] = useState(false);
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setClientId('');
    setScopeIds([]);
    setTotalTreatments(5);
    setPricingMode('percent');
    setDiscountPercent(10);
    setTotalPaid(null);
    setPaymentMethod('cash');
    setValidFrom(todayISO());
    setHasExpiry(false);
    setValidUntil(defaultValidUntil());
    setNotes('');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen]);

  const clientOptions = useMemo(
    () =>
      clients
        .filter((c) => !c.isArchived)
        .map((c) => ({ id: c.id, fullName: c.getFullName() })),
    [clients],
  );

  /**
   * Reference list price: avg price of selected services × number of treatments.
   * Exact for the common 1-service case; a reasonable approximation otherwise.
   */
  const referenceListPrice = useMemo(() => {
    if (!totalTreatments || scopeIds.length === 0) return 0;
    const prices = scopeIds
      .map((id) => services.find((s) => s.id === id)?.price ?? 0);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return avg * totalTreatments;
  }, [scopeIds, totalTreatments, services]);

  const computedFromPercent = useMemo(() => {
    if (pricingMode !== 'percent' || discountPercent == null) return null;
    return Math.max(0, referenceListPrice * (1 - discountPercent / 100));
  }, [pricingMode, discountPercent, referenceListPrice]);

  const effectiveTotalPaid = pricingMode === 'percent' ? (computedFromPercent ?? 0) : (totalPaid ?? 0);

  function validate(): string | null {
    if (!clientId) return 'Seleziona un cliente';
    if (scopeIds.length === 0) return 'Seleziona almeno un servizio';
    if (!totalTreatments || totalTreatments < 1) return 'Inserisci il numero di sedute';
    if (pricingMode === 'percent' && (discountPercent == null || discountPercent < 0 || discountPercent > 100)) {
      return 'Percentuale di sconto non valida (0–100)';
    }
    if (pricingMode === 'manual' && (totalPaid == null || totalPaid < 0)) return 'Inserisci l\'importo incassato';
    if (hasExpiry && new Date(validFrom) > new Date(validUntil)) {
      return 'La data di inizio deve precedere la scadenza';
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setErrorMessage(err); return; }
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await addAbbonamento({
        client_id: clientId,
        scope_service_ids: scopeIds,
        total_treatments: totalTreatments!,
        pricing_mode: pricingMode,
        discount_percent: pricingMode === 'percent' ? discountPercent : null,
        total_paid: effectiveTotalPaid,
        sale_payment_method: paymentMethod,
        valid_from: validFrom,
        valid_until: hasExpiry ? validUntil : null,
        notes: notes.trim() || null,
      });
      messagePopup.getState().success('Abbonamento creato.');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      setErrorMessage(msg);
      messagePopup.getState().error('Errore nella creazione dell\'abbonamento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50';
  const labelClass =
    'flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuovo abbonamento"
      subtitle="Pacchetto di sedute prepagato"
      icon={BadgePercent}
      classes="max-w-2xl"
      contentClasses="overflow-y-auto"
      confirmText={isSubmitting ? 'Creazione…' : 'Crea abbonamento'}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}><User className="size-3.5" />Cliente *</label>
          <CustomSelect
            options={clientOptions}
            labelKey="fullName"
            valueKey="id"
            value={clientId}
            onChange={setClientId}
            placeholder="Cerca cliente…"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Servizi inclusi *</label>
          <ServicesMultiSelect selectedIds={scopeIds} onChange={setScopeIds} />
          {scopeIds.length > 0 && (
            <p className="text-xs text-zinc-500">
              {scopeIds.length === 1
                ? 'Una sola seduta di questo servizio per ogni utilizzo.'
                : `${scopeIds.length} servizi: il cliente può usare una seduta per uno qualsiasi.`}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}><Hash className="size-3.5" />Sedute totali *</label>
          <CustomNumberInput
            value={totalTreatments}
            onChange={setTotalTreatments}
            min={1}
            step={1}
            decimals={0}
            size="lg"
            width="w-36"
          />
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
                  min={0}
                  max={100}
                  step={1}
                  decimals={0}
                  suffix="%"
                  size="lg"
                  width="w-32"
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
                min={0}
                step={1}
                decimals={2}
                suffix="€"
                size="lg"
                width="w-36"
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

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
    </AddModal>
  );
}
