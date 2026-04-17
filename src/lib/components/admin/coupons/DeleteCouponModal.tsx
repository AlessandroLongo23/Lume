'use client';

import { useCouponsStore } from '@/lib/stores/coupons';
import { useClientsStore } from '@/lib/stores/clients';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { DeleteModal } from '@/lib/components/shared/ui/modals/DeleteModal';
import type { Coupon } from '@/lib/types/Coupon';

interface DeleteCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

export function DeleteCouponModal({ isOpen, onClose, coupon }: DeleteCouponModalProps) {
  const deleteCoupon = useCouponsStore((s) => s.deleteCoupon);
  const clients = useClientsStore((s) => s.clients);
  const recipient = coupon ? clients.find((c) => c.id === coupon.recipient_client_id) : null;
  const kindLabel = coupon?.kind === 'gift_card' ? 'gift card' : 'coupon';

  const handleDelete = async () => {
    if (!coupon) return;
    try {
      await deleteCoupon(coupon.id);
      messagePopup.getState().success(`${coupon.kind === 'gift_card' ? 'Gift card' : 'Coupon'} eliminato.`);
      onClose();
    } catch {
      messagePopup.getState().error("Errore durante l'eliminazione.");
    }
  };

  return (
    <DeleteModal isOpen={isOpen} onConfirm={handleDelete} onClose={onClose}>
      <p>
        Sei sicuro di voler eliminare {kindLabel === 'coupon' ? 'questo' : 'questa'} {kindLabel}
        {recipient ? <> di <strong>{recipient.firstName} {recipient.lastName}</strong></> : null}?
        L&apos;azione è irreversibile.
      </p>
    </DeleteModal>
  );
}
