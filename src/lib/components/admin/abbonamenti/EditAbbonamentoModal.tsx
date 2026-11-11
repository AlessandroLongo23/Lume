'use client';

import { useState, useEffect, useMemo } from 'react';
import { Hash, Percent, Wallet, Banknote, CreditCard, Landmark, Calendar, FileText, ShieldCheck, ShieldOff } from 'lucide-react';
import { useAbbonamentiStore } from '@/lib/stores/abbonamenti';
import { useServicesStore } from '@/lib/stores/services';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { Switch } from '@/lib/components/shared/ui/Switch';
import { SwitchRow } from '@/lib/components/shared/ui/forms/SwitchRow';
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
    if (!validFrom) return 'Inserisci una data di inizio valida';
    if (hasExpiry && !validUntil) return 'Inserisci una data di scadenza valida';
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


  if (!abbonamento) return null;

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Modifica abbonamento"
      subtitle={`Sedute rimanenti: ${abbonamento.remainingTreatments} / ${abbonamento.total_treatments}`}
      classes="max-w-2xl"
      confirmText={isSubmitting ? 'Salvataggio…' : 'Salva modifiche'}
    >
      <div className="flex flex-col gap-5">
        <SwitchRow
          className="surface-card px-3 py-2"
          label={
            <span className="inline-flex items-center gap-2">
              {isActive ? (
                <ShieldCheck aria-hidden className="size-4 text-success-strong" />
              ) : (
                <ShieldOff aria-hidden className="size-4 text-[var(--lume-text-muted)]" />
              )}
              {isActive ? 'Abbonamento attivo' : 'Abbonamento disattivato'}
            </span>
          }
          checked={isActive}
          onChange={() => setIsActive((v) => !v)}
        />

        <Field label="Servizi inclusi" required>
          {() => <ServicesMultiSelect selectedIds={scopeIds} onChange={setScopeIds} />}
        </Field>

        <Field label="Sedute totali" labelIcon={Hash} required hint={usedCount > 0 ? `${usedCount} già utilizzate — minimo consentito: ${usedCount}.` : undefined}>
          {({ id, describedBy, invalid }) => (
            <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid}
              value={totalTreatments}
              onChange={setTotalTreatments}
              min={Math.max(1, usedCount)}
              step={1}
              className="w-36"
            />
          )}
        </Field>

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
                      min={0} max={100} step={1}
                      suffix="%" className="w-32"
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
                    min={0} step={1} decimals={2}
                    suffix="€" className="w-36"
                  />
                  <span className="text-xs text-[var(--lume-text-muted)]">totale incassato</span>
                </div>
              )}
            </div>
          )}
        </Field>

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

        <div className="grid grid-cols-2 gap-4">
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

        <TextArea
          label="Note"
          labelIcon={FileText}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note interne (opzionali)…"
        />

        <AbbonamentoUsageList abbonamento={abbonamento} />

        {errorMessage && <p className="text-sm text-danger-strong">{errorMessage}</p>}
      </div>
    </AddModal>
  );
}
