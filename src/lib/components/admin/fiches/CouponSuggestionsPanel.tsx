'use client';

import { useMemo } from 'react';
import { Gift, CreditCard, Sparkles, Calendar, Ban, Check } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import {
  decorateLines,
  couponMatchesFiche,
  eligibleSubtotal,
  computeDiscount,
  freeItemDiscount,
} from '@/lib/utils/coupon-eligibility';
import type { Coupon } from '@/lib/types/Coupon';
import type { FicheServiceDraft, FicheProductDraft } from '@/lib/types/FicheDraft';

export interface SelectedCoupon {
  coupon: Coupon;
  amount: number; // computed € to deduct from the bill
}

interface CouponSuggestionsPanelProps {
  clientId: string;
  services: FicheServiceDraft[];
  products: FicheProductDraft[];
  selected: SelectedCoupon[];
  onSelectedChange: (next: SelectedCoupon[]) => void;
}

/**
 * Computes the € discount for each coupon when applied alongside the others.
 * Stacking rules:
 *   - At most one 'gift' coupon and one 'gift_card' may stack.
 *   - Gift cards are applied AFTER percentage/fixed coupons, so the card balance
 *     is consumed against the post-promo total (capped by its eligible subtotal
 *     minus what the promo already discounted within the same scope).
 */
function recomputeAmount(
  coupon: Coupon,
  promoDiscount: number,
  decoratedServices: ReturnType<typeof decorateLines>['services'],
  decoratedProducts: ReturnType<typeof decorateLines>['products'],
): number {
  if (coupon.discount_type === 'free_item') {
    return freeItemDiscount(coupon, decoratedServices, decoratedProducts);
  }
  const eligible = eligibleSubtotal(coupon, decoratedServices, decoratedProducts);
  if (coupon.kind === 'gift_card') {
    // Eligible subtotal reduced by the promo discount that already hit the bill
    // (this is a conservative approximation when promo scope ⊆ card scope).
    const reduced = Math.max(0, eligible - promoDiscount);
    return computeDiscount(coupon, reduced);
  }
  return computeDiscount(coupon, eligible);
}

export function CouponSuggestionsPanel({
  clientId,
  services,
  products,
  selected,
  onSelectedChange,
}: CouponSuggestionsPanelProps) {
  const allCoupons = useCouponsStore((s) => s.coupons);
  const catalogServices = useServicesStore((s) => s.services);
  const catalogProducts = useProductsStore((s) => s.products);

  const decorated = useMemo(
    () => decorateLines(services, products, catalogServices, catalogProducts),
    [services, products, catalogServices, catalogProducts],
  );

  const eligibleCoupons = useMemo(() => {
    if (!clientId) return [] as Coupon[];
    return allCoupons.filter(
      (c) =>
        c.recipient_client_id === clientId &&
        c.isUsable &&
        couponMatchesFiche(c, decorated.services, decorated.products),
    );
  }, [allCoupons, clientId, decorated]);

  const selectedPromo = useMemo(
    () => selected.find((s) => s.coupon.kind === 'gift') ?? null,
    [selected],
  );
  const selectedCard = useMemo(
    () => selected.find((s) => s.coupon.kind === 'gift_card') ?? null,
    [selected],
  );

  function toggleCoupon(coupon: Coupon) {
    const isSelected =
      coupon.kind === 'gift'
        ? selectedPromo?.coupon.id === coupon.id
        : selectedCard?.coupon.id === coupon.id;

    if (isSelected) {
      onSelectedChange(selected.filter((s) => s.coupon.id !== coupon.id));
      return;
    }

    // Recompute everything because adding/replacing changes promoDiscount input
    // for the gift card branch.
    const nextPromo: Coupon | null =
      coupon.kind === 'gift' ? coupon : (selectedPromo?.coupon ?? null);
    const nextCard: Coupon | null =
      coupon.kind === 'gift_card' ? coupon : (selectedCard?.coupon ?? null);

    const promoAmount = nextPromo
      ? recomputeAmount(nextPromo, 0, decorated.services, decorated.products)
      : 0;
    const cardAmount = nextCard
      ? recomputeAmount(nextCard, promoAmount, decorated.services, decorated.products)
      : 0;

    const next: SelectedCoupon[] = [];
    if (nextPromo) next.push({ coupon: nextPromo, amount: promoAmount });
    if (nextCard) next.push({ coupon: nextCard, amount: cardAmount });
    onSelectedChange(next);
  }

  if (!clientId) return null;

  if (eligibleCoupons.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-zinc-500/20 text-xs text-zinc-400">
        <Sparkles className="size-3.5" />
        Nessun coupon disponibile per questo cliente sui servizi/prodotti selezionati.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-indigo-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Coupon disponibili
        </span>
      </div>

      <div className="grid gap-2">
        {eligibleCoupons.map((c) => {
          const isPromo = c.kind === 'gift';
          const isSelected =
            isPromo ? selectedPromo?.coupon.id === c.id : selectedCard?.coupon.id === c.id;
          const promoAmt = selectedPromo?.amount ?? 0;
          const previewAmount = recomputeAmount(
            c,
            isPromo ? 0 : promoAmt,
            decorated.services,
            decorated.products,
          );
          const blocked = previewAmount <= 0;

          const Icon = isPromo ? Gift : CreditCard;
          const accent = isPromo
            ? 'border-indigo-500/30 bg-indigo-500/5'
            : 'border-emerald-500/30 bg-emerald-500/5';
          const accentSelected = isPromo
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-emerald-500 bg-emerald-500/10';

          return (
            <button
              key={c.id}
              type="button"
              disabled={blocked && !isSelected}
              onClick={() => toggleCoupon(c)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                isSelected ? accentSelected : accent
              } ${blocked && !isSelected ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}
            >
              <Icon className={`size-4 shrink-0 ${isPromo ? 'text-indigo-500' : 'text-emerald-500'}`} />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {isPromo ? 'Coupon' : 'Gift card'} · {c.displayDiscount()}
                  </span>
                  {c.hasUnlimitedScope ? (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">tutto</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">scoped</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Calendar className="size-3" />
                  <span>fino al {new Date(c.valid_until).toLocaleDateString('it-IT')}</span>
                  {blocked && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Ban className="size-3" />
                      saldo o ambito a zero su questa fiche
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className={`text-sm font-mono font-semibold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                  {previewAmount > 0 ? `− € ${previewAmount.toFixed(2)}` : '€ 0,00'}
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                    <Check className="size-3" /> applicato
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-zinc-400">
        Massimo un coupon regalo + una gift card per fiche. Le gift card vengono applicate dopo gli altri sconti.
      </p>
    </div>
  );
}
