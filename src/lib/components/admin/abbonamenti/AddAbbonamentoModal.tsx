'use client';

import { useState, useEffect, useMemo } from 'react';
import { User, Hash, Percent, Wallet, Banknote, CreditCard, Landmark, Calendar, FileText } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { ServicesMultiSelect } from './ServicesMultiSelect';
import type { AbbonamentoPaymentMethod, AbbonamentoPricingMode } from '@/lib/types/Abbonamento';
import { useFormDefaults, todayPlusMonthsISO } from '@/lib/hooks/useFormDefaults';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';

interface AddAbbonamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddAbbonamentoModal({ isOpen, onClose }: AddAbbonamentoModalProps) {
  const addAbbonamento = useAbbonamentiStore((s) => s.addAbbonamento);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);
  const formDefaults = useFormDefaults();

  const [clientId, setClientId] = useState('');
  const [scopeIds, setScopeIds] = useState<string[]>([]);
  const [totalTreatments, setTotalTreatments] = useState<number | null>(formDefaults.abbonamento_treatments);
  const [pricingMode, setPricingMode] = useState<AbbonamentoPricingMode>('percent');
  const [discountPercent, setDiscountPercent] = useState<number | null>(formDefaults.abbonamento_discount_percent);
  const [totalPaid, setTotalPaid] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<AbbonamentoPaymentMethod>(formDefaults.abbonamento_payment_method);
  const [validFrom, setValidFrom] = useState(todayISO());
  const [hasExpiry, setHasExpiry] = useState(false);
  const [validUntil, setValidUntil] = useState(() => todayPlusMonthsISO(12));
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setClientId('');
    setScopeIds([]);
    setTotalTreatments(formDefaults.abbonamento_treatments);
    setPricingMode('percent');
    setDiscountPercent(formDefaults.abbonamento_discount_percent);
    setTotalPaid(null);
    setPaymentMethod(formDefaults.abbonamento_payment_method);
    setValidFrom(todayISO());
    setHasExpiry(false);
    setValidUntil(todayPlusMonthsISO(12));
    setNotes('');
    setErrorMessage('');
    setIsSubmitting(false);
  }, [isOpen, formDefaults.abbonamento_treatments, formDefaults.abbonamento_discount_percent, formDefaults.abbonamento_payment_method]);

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
    if (!validFrom) return 'Inserisci una data di inizio valida';
    if (hasExpiry && !validUntil) return 'Inserisci una data di scadenza valida';
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
      emitTourEvent('abbonamento:created');
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Errore sconosciuto';
      setErrorMessage(msg);
      messagePopup.getState().error('Errore nella creazione dell\'abbonamento.');
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Nuovo abbonamento"
      subtitle="Pacchetto di sedute prepagato"
      classes="max-w-2xl"
      confirmText={isSubmitting ? 'Creazione…' : 'Crea abbonamento'}
      confirmDataTour="save-abbonamento"
      onEnterComplete={() => emitTourEvent('abbonamento:modal-open')}
    >
      <div data-tour="abbonamento-form" className="flex flex-col gap-5">
        <Field label="Cliente" labelIcon={User} required>
          {({ id }) => (
            <Select
              id={id}
              options={clientOptions}
              labelKey="fullName"
              valueKey="id"
              value={clientId}
              onChange={(v) => { setClientId(v); emitTourEvent('abbonamento:client-selected'); }}
              placeholder="Cerca cliente…"
            />
          )}
        </Field>

        <Field
          label="Servizi inclusi"
          required
          hint={
            scopeIds.length === 0
              ? undefined
              : scopeIds.length === 1
                ? 'Una sola seduta di questo servizio per ogni utilizzo.'
                : `${scopeIds.length} servizi: il cliente può usare una seduta per uno qualsiasi.`
          }
        >
          {() => (
            <ServicesMultiSelect
              selectedIds={scopeIds}
              onChange={(ids) => { setScopeIds(ids); if (ids.length > 0) emitTourEvent('abbonamento:service-added'); }}
            />
          )}
        </Field>

        <div data-tour="field-abbonamento-treatments">
          <Field label="Sedute totali" labelIcon={Hash} required>
            {({ id, describedBy, invalid }) => (
              <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid}
                value={totalTreatments}
                onChange={setTotalTreatments}
                min={1}
                step={1}
                className="w-36"
              />
            )}
          </Field>
        </div>

        <div data-tour="field-abbonamento-pricing">
          <Field label="Prezzo" required>
            {() => (
              <div className="flex flex-col gap-2">
                <ToggleButton
                  ariaLabel="Modalità di prezzo"
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
                      <NumberInput aria-label="Sconto sul listino in percentuale"
                        value={discountPercent}
                        onChange={setDiscountPercent}
                        min={0}
                        max={100}
                        step={1}
                        suffix="%"
                        className="w-32"
                      />
                      <span className="text-xs text-[var(--lume-text-muted)]">di sconto sul listino</span>
                    </div>
                    {referenceListPrice > 0 && (
                      <div className="flex flex-col gap-0.5 surface-card px-3 py-2 text-xs">
                        <span className="text-[var(--lume-text-secondary)]">
                          Prezzo di listino: <span className="tabular-nums">€ {referenceListPrice.toFixed(2)}</span>
                        </span>
                        <span className="text-[var(--lume-text)] font-medium">
                          Totale da incassare: <span className="tabular-nums">€ {(computedFromPercent ?? 0).toFixed(2)}</span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <NumberInput aria-label="Totale incassato"
                      value={totalPaid}
                      onChange={setTotalPaid}
                      min={0}
                      step={1}
                      decimals={2}
                      suffix="€"
                      className="w-36"
                    />
                    <span className="text-xs text-[var(--lume-text-muted)]">totale incassato</span>
                  </div>
                )}
              </div>
            )}
          </Field>
        </div>

        <div data-tour="field-abbonamento-payment">
          <Field label="Metodo di pagamento" required>
            {() => (
              <ToggleButton
                ariaLabel="Metodo di pagamento"
                options={['cash', 'card', 'transfer'] as AbbonamentoPaymentMethod[]}
                labels={['Contanti', 'Carta', 'Bonifico']}
                icons={[Banknote, CreditCard, Landmark]}
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as AbbonamentoPaymentMethod)}
                className="w-full"
              />
            )}
          </Field>
        </div>

        <div data-tour="field-abbonamento-validity" className="grid grid-cols-2 gap-4">
          <Field label="Valido dal" labelIcon={Calendar} required>
            {({ id }) => <DateField id={id} value={validFrom} onChange={setValidFrom} />}
          </Field>
          <Field
            label="Scadenza"
            labelIcon={Calendar}
            labelAction={
              <span className="flex items-center gap-2 text-xs text-[var(--lume-text-secondary)]">
                Imposta
                <Switch aria-label="Imposta una scadenza" checked={hasExpiry} onChange={() => setHasExpiry((v) => !v)} />
              </span>
            }
          >
              {({ id }) => (
                <DateField
                  id={id}
                  value={validUntil}
                  onChange={setValidUntil}
                  min={validFrom || undefined}
                  disabled={!hasExpiry}
                />
              )}
            </Field>
        </div>

        <div data-tour="field-abbonamento-notes">
          <TextArea
            label="Note"
            labelIcon={FileText}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Note interne (opzionali)…"
          />
        </div>

        {errorMessage && <p className="text-sm text-danger-strong">{errorMessage}</p>}
      </div>
    </AddModal>
  );
}
