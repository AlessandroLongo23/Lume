'use client';

import { useState, useEffect, useMemo } from 'react';
import { Gift, User, Calendar, FileText, Scissors, Package, Percent, Euro } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useClientsStore } from '@/lib/stores/clients';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { CouponScopePicker, EMPTY_SCOPE, type CouponScopeValue } from './CouponScopePicker';
import { CouponNotifySuccess } from './CouponNotifySuccess';
import { buildCouponMessage, sendCouponEmail } from '@/lib/utils/coupon-notify';
import type { Coupon, CouponDiscountType, CouponFreeItemKind } from '@/lib/types/Coupon';
import { useFormDefaults, todayPlusMonthsISO } from '@/lib/hooks/useFormDefaults';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';

interface GiftCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GiftCouponModal({ isOpen, onClose }: GiftCouponModalProps) {
  const addCoupon = useCouponsStore((s) => s.addCoupon);
  const clients = useClientsStore((s) => s.clients);
  const services = useServicesStore((s) => s.services);
  const products = useProductsStore((s) => s.products);
  const salonName = useSubscriptionStore((s) => s.salonName) || 'Il tuo salone';
  const formDefaults = useFormDefaults();

  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recipientId, setRecipientId] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>(formDefaults.gift_coupon_discount_type);
  const [discountValue, setDiscountValue] = useState<number | null>(null);
  const [freeItemKind, setFreeItemKind] = useState<CouponFreeItemKind>('service');
  const [freeItemId, setFreeItemId] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState<string>(() => todayPlusMonthsISO(formDefaults.gift_coupon_validity_months));
  const [scope, setScope] = useState<CouponScopeValue>(EMPTY_SCOPE);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [createdCoupon, setCreatedCoupon] = useState<Coupon | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setView('form');
    setIsSubmitting(false);
    setRecipientId('');
    setDiscountType(formDefaults.gift_coupon_discount_type);
    setDiscountValue(null);
    setFreeItemKind('service');
    setFreeItemId('');
    setValidFrom(new Date().toISOString().slice(0, 10));
    setValidUntil(todayPlusMonthsISO(formDefaults.gift_coupon_validity_months));
    setScope(EMPTY_SCOPE);
    setNotes('');
    setErrorMessage('');
    setCreatedCoupon(null);
    setSuccessMessage('');
  }, [isOpen, formDefaults.gift_coupon_discount_type, formDefaults.gift_coupon_validity_months]);

  const clientOptions = useMemo(
    () => clients.filter((c) => !c.isArchived).map((c) => ({ ...c, fullName: c.getFullName() })),
    [clients],
  );
  const activeServices = useMemo(() => services.filter((s) => !s.isArchived), [services]);
  const activeProducts = useMemo(() => products.filter((p) => !p.isArchived), [products]);
  const recipient = useMemo(() => clients.find((c) => c.id === recipientId) ?? null, [clients, recipientId]);

  const freeItemName = useMemo(() => {
    if (discountType !== 'free_item' || !freeItemId) return null;
    if (freeItemKind === 'service') return services.find((s) => s.id === freeItemId)?.name ?? null;
    return products.find((p) => p.id === freeItemId)?.name ?? null;
  }, [discountType, freeItemKind, freeItemId, services, products]);

  function validate(): string | null {
    if (!recipientId) return 'Seleziona un destinatario';
    if (!validFrom || !validUntil) return 'Seleziona le date di validità';
    if (new Date(validFrom) > new Date(validUntil)) return 'La data di inizio deve precedere la scadenza';
    if (discountType === 'fixed' && (discountValue == null || discountValue <= 0)) return 'Inserisci un importo';
    if (discountType === 'percent' && (discountValue == null || discountValue <= 0 || discountValue > 100))
      return 'Inserisci una percentuale tra 1 e 100';
    if (discountType === 'free_item' && !freeItemId) return 'Seleziona il servizio o prodotto omaggio';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setErrorMessage(err); return; }
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const coupon = await addCoupon({
        kind: 'gift',
        recipient_client_id: recipientId,
        discount_type: discountType,
        discount_value: discountType === 'free_item' ? null : discountValue,
        free_item_kind: discountType === 'free_item' ? freeItemKind : null,
        free_item_id: discountType === 'free_item' ? freeItemId : null,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil + 'T23:59:59').toISOString(),
        scope_service_ids: scope.scope_service_ids,
        scope_product_ids: scope.scope_product_ids,
        scope_service_category_ids: scope.scope_service_category_ids,
        scope_product_category_ids: scope.scope_product_category_ids,
        notes: notes.trim() || null,
      });

      const client = clients.find((c) => c.id === recipientId);
      if (!client) throw new Error('Cliente non trovato');
      const message = buildCouponMessage(coupon, client, salonName, freeItemName);
      setCreatedCoupon(coupon);
      setSuccessMessage(message);
      setView('success');
      messagePopup.getState().success('Coupon creato.');
      // Advances an interactive guide's "save" step on a successful create.
      emitTourEvent('coupon:created');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Errore sconosciuto');
      messagePopup.getState().error("Errore nella creazione del coupon.");
    } finally {
      setIsSubmitting(false);
    }
  }


  const onConfirm = view === 'form' ? handleSubmit : onClose;
  const confirmText = view === 'form' ? (isSubmitting ? 'Creazione…' : 'Crea coupon') : 'Chiudi';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onConfirm}
      title="Nuovo coupon regalo"
      subtitle="Regala un coupon a un cliente"
      classes="max-w-2xl"
      confirmText={confirmText}
      confirmDisabled={isSubmitting}
      confirmDataTour="save-coupon"
      // Emit only after the open animation settles, so the guide's next step
      // (anchored on a field inside the modal) measures its final position.
      onEnterComplete={() => emitTourEvent('coupon:modal-open')}
    >
      {view === 'success' && createdCoupon && recipient ? (
        <CouponNotifySuccess
          coupon={createdCoupon}
          recipient={recipient}
          message={successMessage}
          onSendEmail={() => sendCouponEmail({ recipient, coupon: createdCoupon, salonName, message: successMessage })}
        />
      ) : (
        <div className="flex flex-col gap-5" data-tour="coupon-form">
          <Field label="Destinatario" labelIcon={User} required>
            {({ id }) => (
              <Select
                id={id}
                options={clientOptions}
                labelKey="fullName"
                valueKey="id"
                value={recipientId}
                onChange={(v) => {
                  // Advances an interactive guide's "choose the recipient" step once
                  // the user picks a client (no-op when no tour is running).
                  if (v && v !== recipientId) emitTourEvent('coupon:recipient-selected');
                  setRecipientId(v);
                }}
                placeholder="Cerca cliente…"
              />
            )}
          </Field>

          <div data-tour="coupon-field-discount">
            <Field label="Tipo di sconto" required>
              {() => (
                <div className="flex flex-col gap-2">
                  <ToggleButton
                    ariaLabel="Tipo di sconto"
                    options={['fixed', 'percent', 'free_item'] as CouponDiscountType[]}
                    labels={['Importo fisso', 'Percentuale', 'Omaggio']}
                    icons={[Euro, Percent, Gift]}
                    value={discountType}
                    onChange={(v) => setDiscountType(v as CouponDiscountType)}
                    className="w-full"
                  />

                  {discountType === 'fixed' && (
                    <div className="flex items-center gap-2">
                      <NumberInput
                        aria-label="Sconto in euro"
                        value={discountValue}
                        onChange={(v) => setDiscountValue(v)}
                        min={0}
                        step={0.5}
                        decimals={2}
                        suffix="€"
                        className="w-36"
                      />
                      <span className="text-xs text-[var(--lume-text-muted)]">di sconto</span>
                    </div>
                  )}
                  {discountType === 'percent' && (
                    <div className="flex items-center gap-2">
                      <NumberInput
                        aria-label="Sconto in percentuale"
                        value={discountValue}
                        onChange={(v) => setDiscountValue(v)}
                        min={0}
                        step={1}
                        suffix="%"
                        className="w-32"
                      />
                      <span className="text-xs text-[var(--lume-text-muted)]">di sconto</span>
                    </div>
                  )}
                  {discountType === 'free_item' && (
                    <div className="flex flex-col gap-2">
                      <ToggleButton
                        ariaLabel="Tipo di omaggio"
                        options={['service', 'product'] as CouponFreeItemKind[]}
                        labels={['Servizio', 'Prodotto']}
                        icons={[Scissors, Package]}
                        value={freeItemKind}
                        onChange={(v) => { setFreeItemKind(v as CouponFreeItemKind); setFreeItemId(''); }}
                        className="w-full"
                      />
                      <Select
                        options={freeItemKind === 'service' ? activeServices : activeProducts}
                        labelKey="name"
                        valueKey="id"
                        value={freeItemId}
                        onChange={setFreeItemId}
                        placeholder={freeItemKind === 'service' ? 'Seleziona servizio…' : 'Seleziona prodotto…'}
                      />
                    </div>
                  )}
                </div>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4" data-tour="coupon-field-validity">
            <Field label="Valido dal" labelIcon={Calendar} required>
              {({ id }) => <DateField id={id} value={validFrom} onChange={setValidFrom} />}
            </Field>
            <Field label="Valido fino al" labelIcon={Calendar} required>
              {({ id }) => <DateField id={id} value={validUntil} onChange={setValidUntil} />}
            </Field>
          </div>

          <div data-tour="coupon-field-scope">
            <Field label="Ambito">
              {() => <CouponScopePicker value={scope} onChange={setScope} />}
            </Field>
          </div>

          <div data-tour="coupon-field-notes">
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
      )}
    </AddModal>
  );
}
