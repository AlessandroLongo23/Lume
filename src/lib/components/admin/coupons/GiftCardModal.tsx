'use client';

import { useState, useEffect, useMemo } from 'react';
import { CreditCard, User, UserPlus, Calendar, FileText, Banknote, Wallet, Building2 } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useClientsStore } from '@/lib/stores/clients';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { AddModal } from '@/lib/components/shared/ui/modals/AddModal';
import { CustomSelect } from '@/lib/components/shared/ui/forms/CustomSelect';
import { CustomNumberInput } from '@/lib/components/shared/ui/forms/CustomNumberInput';
import { CustomCheckbox } from '@/lib/components/shared/ui/forms/CustomCheckbox';
import { ToggleButton } from '@/lib/components/shared/ui/ToggleButton';
import { CouponScopePicker, EMPTY_SCOPE, type CouponScopeValue } from './CouponScopePicker';
import { CouponNotifySuccess } from './CouponNotifySuccess';
import { buildCouponMessage, sendCouponEmail } from '@/lib/utils/coupon-notify';
import type { Coupon, CouponSalePaymentMethod } from '@/lib/types/Coupon';

interface GiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function defaultValidUntil(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function GiftCardModal({ isOpen, onClose }: GiftCardModalProps) {
  const addCoupon = useCouponsStore((s) => s.addCoupon);
  const clients = useClientsStore((s) => s.clients);
  const salonName = useSubscriptionStore((s) => s.salonName) || 'Il tuo salone';

  const [view, setView] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [purchaserId, setPurchaserId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [forSelf, setForSelf] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [salePaymentMethod, setSalePaymentMethod] = useState<CouponSalePaymentMethod>('cash');
  const [validFrom, setValidFrom] = useState<string>(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState<string>(defaultValidUntil());
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
    setValidUntil(defaultValidUntil());
    setScope(EMPTY_SCOPE);
    setNotes('');
    setErrorMessage('');
    setCreatedCoupon(null);
    setSuccessMessage('');
  }, [isOpen]);

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
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Errore sconosciuto');
      messagePopup.getState().error('Errore nella vendita della gift card.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-zinc-500/25 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50';
  const labelClass =
    'flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide';

  const onConfirm = view === 'form' ? handleSubmit : onClose;
  const confirmText = view === 'form' ? (isSubmitting ? 'Vendita…' : 'Vendi gift card') : 'Chiudi';

  return (
    <AddModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onConfirm}
      title="Vendi gift card"
      subtitle="Registra la vendita di una gift card per un cliente"
      icon={CreditCard}
      classes="max-w-2xl"
      contentClasses="overflow-y-auto"
      confirmText={confirmText}
      confirmDisabled={isSubmitting}
    >
      {view === 'success' && createdCoupon && recipient ? (
        <CouponNotifySuccess
          coupon={createdCoupon}
          recipient={recipient}
          message={successMessage}
          onSendEmail={() => sendCouponEmail({ recipient, coupon: createdCoupon, salonName, message: successMessage })}
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}><UserPlus className="size-3.5" />Acquirente *</label>
              <CustomSelect
                options={clientOptions}
                labelKey="fullName"
                valueKey="id"
                value={purchaserId}
                onChange={setPurchaserId}
                placeholder="Cerca acquirente…"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}><User className="size-3.5" />Destinatario *</label>
              {forSelf ? (
                <input
                  type="text"
                  className={`${inputClass} bg-zinc-50 dark:bg-zinc-700/30 cursor-not-allowed`}
                  value="Stesso dell'acquirente"
                  readOnly
                />
              ) : (
                <CustomSelect
                  options={clientOptions}
                  labelKey="fullName"
                  valueKey="id"
                  value={recipientId}
                  onChange={setRecipientId}
                  placeholder="Cerca destinatario…"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CustomCheckbox checked={forSelf} onChange={(v) => { setForSelf(v); if (v) setRecipientId(''); }} />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">L&apos;acquirente la usa per sé</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}><Wallet className="size-3.5" />Valore della gift card *</label>
            <CustomNumberInput
              value={amount}
              onChange={setAmount}
              min={0}
              step={5}
              decimals={2}
              suffix="€"
              size="lg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Metodo di pagamento *</label>
            <ToggleButton
              options={['cash', 'card', 'transfer'] as CouponSalePaymentMethod[]}
              labels={['Contanti', 'Carta', 'Bonifico']}
              icons={[Banknote, CreditCard, Building2]}
              value={salePaymentMethod}
              onChange={(v) => setSalePaymentMethod(v as CouponSalePaymentMethod)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}><Calendar className="size-3.5" />Valida dal *</label>
              <input
                type="date"
                className={inputClass}
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}><Calendar className="size-3.5" />Valida fino al *</label>
              <input
                type="date"
                className={inputClass}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Ambito</label>
            <CouponScopePicker value={scope} onChange={setScope} />
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
      )}
    </AddModal>
  );
}
