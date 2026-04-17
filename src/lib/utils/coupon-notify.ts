import type { Coupon } from '@/lib/types/Coupon';
import type { Client } from '@/lib/types/Client';

function formatDateIt(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function describeDiscount(coupon: Coupon, freeItemName?: string | null): string {
  if (coupon.kind === 'gift_card') {
    return `una gift card del valore di € ${(coupon.original_value ?? 0).toFixed(2)}`;
  }
  if (coupon.discount_type === 'fixed') return `uno sconto di € ${(coupon.discount_value ?? 0).toFixed(2)}`;
  if (coupon.discount_type === 'percent') return `uno sconto del ${coupon.discount_value ?? 0}%`;
  if (coupon.discount_type === 'free_item' && freeItemName) return `un buono omaggio per "${freeItemName}"`;
  return 'un coupon omaggio';
}

export function buildCouponMessage(
  coupon: Coupon,
  recipient: { firstName: string },
  salonName: string,
  freeItemName?: string | null,
): string {
  const what = describeDiscount(coupon, freeItemName);
  const validUntil = formatDateIt(coupon.valid_until);
  return [
    `Ciao ${recipient.firstName}!`,
    `${salonName} ti ha regalato ${what}.`,
    `Valido fino al ${validUntil}.`,
    `A presto!`,
  ].join(' ');
}

export function buildWhatsAppLink(client: Pick<Client, 'phonePrefix' | 'phoneNumber'>, message: string): string | null {
  if (!client.phonePrefix || !client.phoneNumber) return null;
  const phone = `${client.phonePrefix}${client.phoneNumber}`.replace(/[^0-9]/g, '');
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Server-side email send is fired and forgotten. Failures are logged but never
 * surface to the operator — the wa.me link remains as the primary channel.
 */
export async function sendCouponEmail(params: {
  recipient: Pick<Client, 'email' | 'firstName'>;
  coupon: Coupon;
  salonName: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!params.recipient.email) return { success: false, error: 'Email destinatario mancante' };
  try {
    const res = await fetch('/api/coupons/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.recipient.email,
        firstName: params.recipient.firstName,
        kind: params.coupon.kind,
        validUntil: params.coupon.valid_until,
        salonName: params.salonName,
        message: params.message,
      }),
    });
    const json = await res.json();
    if (!json.success) return { success: false, error: json.error };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Errore invio email' };
  }
}
