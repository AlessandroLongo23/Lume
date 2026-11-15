'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, User, UserPlus, Calendar, FileText, Banknote, Wallet, Building2 } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useClientsStore } from '@/lib/stores/clients';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { Select } from '@/lib/components/shared/ui/forms/Select';
import { NumberInput } from '@/lib/components/shared/ui/forms/NumberInput';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { DateField } from '@/lib/components/shared/ui/forms/DateField';
import { TextArea } from '@/lib/components/shared/ui/forms/TextArea';
import { Checkbox } from '@/lib/components/shared/ui/forms/Checkbox';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { CouponScopePicker, EMPTY_SCOPE, type CouponScopeValue } from './CouponScopePicker';
import { CouponNotifySuccess } from './CouponNotifySuccess';
import { buildCouponMessage, sendCouponEmail } from '@/lib/utils/coupon-notify';
import type { Coupon, CouponSalePaymentMethod } from '@/lib/types/Coupon';
import { useFormDefaults, todayPlusMonthsISO } from '@/lib/hooks/useFormDefaults';
import { emitTourEvent } from '@/lib/tutorials/tourEvents';

interface GiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GiftCardModal({ isOpen, onClose }: GiftCardModalProps) {
  const addCoupon = useCouponsStore((s) => s.addCoupon);
  const clients = useClientsStore((s) => s.clients);
  const salonName = useSubscriptionStore((s) => s.salonName) || 'Il tuo salone';
  const formDefaults = useFormDefaults();

  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [purchaserId, setPurchaserId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [forSelf, setForSelf] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [salePaymentMethod, setSalePaymentMethod] = useState<CouponSalePaymentMethod>('cash');
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState<string>(() => todayPlusMonthsISO(formDefaults.gift_card_validity_months));
  const [scope, setScope] = useState<CouponScopeValue>(EMPTY_SCOPE);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [createdCoupon, setCreatedCoupon] = useState<Coupon | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setView('form');
    setIsSubmitting(false);
    setPurchaserId('');
    setRecipientId('');
    setForSelf(false);
    setAmount(null);
    setSalePaymentMethod('cash');
    setValidFrom(new Date().toISOString().slice(0, 10));
    setValidUntil(todayPlusMonthsISO(formDefaults.gift_card_validity_months));
    setScope(EMPTY_SCOPE);
    setNotes('');
    setErrorMessage('');
    setCreatedCoupon(null);
    setSuccessMessage('');
  }, [isOpen, formDefaults.gift_card_validity_months]);

  const clientOptions = useMemo(
    () => clients.filter((c) => !c.isArchived).map((c) => ({ ...c, fullName: c.getFullName() })),
    [clients],
  );
  const recipient = useMemo(() => {
    const id = forSelf ? purchaserId : recipientId;
    return clients.find((c) => c.id === id) ?? null;
  }, [clients, recipientId, purchaserId, forSelf]);

  function validate(): string | null {
    if (!purchaserId) return 'Seleziona un acquirente';
    const finalRecipient = forSelf ? purchaserId : recipientId;
    if (!finalRecipient) return 'Seleziona un destinatario';
    if (amount == null || amount <= 0) return 'Inserisci il valore della gift card';
    if (!validFrom || !validUntil) return 'Seleziona le date di validità';
    if (new Date(validFrom) > new Date(validUntil)) return 'La data di inizio deve precedere la scadenza';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setErrorMessage(err); return; }
    if (isSubmitting) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const finalRecipient = forSelf ? purchaserId : recipientId;
      const coupon = await addCoupon({
        kind: 'gift_card',
        recipient_client_id: finalRecipient,
        purchaser_client_id: purchaserId,
        discount_type: 'fixed',
        discount_value: null,
        original_value: amount!,
        sale_amount: amount!,
        sale_payment_method: salePaymentMethod,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil + 'T23:59:59').toISOString(),
        scope_service_ids: scope.scope_service_ids,
        scope_product_ids: scope.scope_product_ids,
        scope_service_category_ids: scope.scope_service_category_ids,
        scope_product_category_ids: scope.scope_product_category_ids,
        notes: notes.trim() || null,
      });

      const client = clients.find((c) => c.id === finalRecipient);
      if (!client) throw new Error('Cliente non trovato');
      const message = buildCouponMessage(coupon, client, salonName, null);
      setCreatedCoupon(coupon);
      setSuccessMessage(message);
      setView('success');
      messagePopup.getState().success('Gift card creata.');
      // Advances an interactive guide's "save" step on a successful sale.
      emitTourEvent('gift-card:created');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Errore sconosciuto');
      messagePopup.getState().error('Errore nella vendita della gift card.');
    } finally {
      setIsSubmitting(false);
    }
  }


  const onConfirm = view === 'form' ? handleSubmit : onClose;
  const confirmText = view === 'form' ? (isSubmitting ? 'Vendita…' : 'Vendi gift card') : 'Chiudi';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onConfirm}
      title="Vendi gift card"
      subtitle="Registra la vendita di una gift card per un cliente"
      classes="max-w-2xl"
      confirmText={confirmText}
      confirmDisabled={isSubmitting}
      confirmDataTour="save-gift-card"
      // Emit only after the open animation settles, so the guide's next step
      // (anchored on a field inside the modal) measures its final position.
      onEnterComplete={() => emitTourEvent('gift-card:modal-open')}
    >
      {view === 'success' && createdCoupon && recipient ? (
        <CouponNotifySuccess
          coupon={createdCoupon}
          recipient={recipient}
          message={successMessage}
          onSendEmail={() => sendCouponEmail({ recipient, coupon: createdCoupon, salonName, message: successMessage })}
        />
      ) : (
        <div className="flex flex-col gap-5" data-tour="gift-card-form">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Acquirente" labelIcon={UserPlus} required>
              {({ id }) => (
                <Select
                  id={id}
                  options={clientOptions}
                  labelKey="fullName"
                  valueKey="id"
                  value={purchaserId}
                  onChange={(v) => {
                    // Advances an interactive guide's "choose the buyer" step once the
                    // user picks a client (no-op when no tour is running).
                    if (v && v !== purchaserId) emitTourEvent('gift-card:purchaser-selected');
                    setPurchaserId(v);
                  }}
                  placeholder="Cerca acquirente…"
                />
              )}
            </Field>
            {forSelf ? (
              <FormInput label="Destinatario" labelIcon={User} required value="Stesso dell'acquirente" readOnly disabled />
            ) : (
              <Field label="Destinatario" labelIcon={User} required>
                {({ id }) => (
                  <Select
                    id={id}
                    options={clientOptions}
                    labelKey="fullName"
                    valueKey="id"
                    value={recipientId}
                    onChange={(v) => {
                      // Advances an interactive guide's "choose the recipient" step.
                      if (v && v !== recipientId) emitTourEvent('gift-card:recipient-selected');
                      setRecipientId(v);
                    }}
                    placeholder="Cerca destinatario…"
                  />
                )}
              </Field>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={forSelf} onChange={(e) => {
              const v = e.target.checked;
              setForSelf(v);
              if (v) {
                setRecipientId('');
                // Checking "uses it for self" also resolves the recipient, so it
                // advances the guide's recipient step like picking one from the menu.
                emitTourEvent('gift-card:recipient-selected');
              }
            }} />
            <span className="text-sm text-[var(--lume-text)]">L&apos;acquirente la usa per sé</span>
          </div>

          <div data-tour="gift-card-field-amount">
            <Field label="Valore della gift card" labelIcon={Wallet} required>
              {({ id, describedBy, invalid }) => (
                <NumberInput id={id} aria-describedby={describedBy} aria-invalid={invalid}
                  value={amount}
                  onChange={setAmount}
                  min={0}
                  step={5}
                  decimals={2}
                  suffix="€"
                />
              )}
            </Field>
          </div>

          <div data-tour="gift-card-field-payment">
            <Field label="Metodo di pagamento" required>
              {() => (
                <ToggleButton
                  ariaLabel="Metodo di pagamento"
                  options={['cash', 'card', 'transfer'] as CouponSalePaymentMethod[]}
                  labels={['Contanti', 'Carta', 'Bonifico']}
                  icons={[Banknote, CreditCard, Building2]}
                  value={salePaymentMethod}
                  onChange={(v) => setSalePaymentMethod(v as CouponSalePaymentMethod)}
                  className="w-full"
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4" data-tour="gift-card-field-validity">
            <Field label="Valida dal" labelIcon={Calendar} required>
              {({ id }) => <DateField id={id} value={validFrom} onChange={setValidFrom} />}
            </Field>
            <Field label="Valida fino al" labelIcon={Calendar} required>
              {({ id }) => <DateField id={id} value={validUntil} onChange={setValidUntil} />}
            </Field>
          </div>

          <div data-tour="gift-card-field-scope">
            <Field label="Ambito">
              {() => <CouponScopePicker value={scope} onChange={setScope} />}
            </Field>
          </div>

          <div data-tour="gift-card-field-notes">
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
