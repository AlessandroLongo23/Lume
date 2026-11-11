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
import { ListBox, ListRow } from '@/lib/components/shared/ui/list/ListBox';
import { Callout } from '@/lib/components/shared/ui/Callout';

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
      <Callout icon={Sparkles}>
        Nessun coupon disponibile per questo cliente sui servizi/prodotti selezionati.
      </Callout>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-[var(--lume-text-muted)]" />
        <span className="text-xs font-medium text-[var(--lume-text-secondary)]">
          Coupon disponibili
        </span>
      </div>

      <ListBox role="list" aria-label="Coupon disponibili" className="surface-card">
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
          return (
            <ListRow
              key={c.id}
              asChild
              selected={isSelected}
              aria-pressed={isSelected}
              disabled={blocked && !isSelected}
              onClick={() => toggleCoupon(c)}
            >
              <button
                // ds-ignore: the row element ListRow renders through asChild; ListRow's own slots would mute the coloured icon and truncate this two-column layout
                type="button"
                className="gap-3 py-2.5"
              >
              <Icon className={`size-4 shrink-0 ${isPromo ? 'text-info-strong' : 'text-success-strong'}`} />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-[var(--lume-text)]">
                    {isPromo ? 'Coupon' : 'Gift card'} · {c.displayDiscount()}
                  </span>
                  {c.hasUnlimitedScope ? (
                    <span className="text-2xs text-[var(--lume-text-muted)]">tutto</span>
                  ) : (
                    <span className="text-2xs text-[var(--lume-text-muted)]">scoped</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--lume-text-secondary)]">
                  <Calendar className="size-3" />
                  <span>fino al {new Date(c.valid_until).toLocaleDateString('it-IT')}</span>
                  {blocked && (
                    <span className="flex items-center gap-1 text-warning-strong">
                      <Ban className="size-3" />
                      saldo o ambito a zero su questa fiche
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className={`text-sm tabular-nums font-medium ${isSelected ? 'text-success-strong' : 'text-[var(--lume-text)]'}`}>
                  {previewAmount > 0 ? `− € ${previewAmount.toFixed(2)}` : '€ 0,00'}
                </span>
                {isSelected && (
                  <span className="flex items-center gap-1 text-2xs text-success-strong">
                    <Check className="size-3" /> applicato
                  </span>
                )}
              </div>
              </button>
            </ListRow>
          );
        })}
      </ListBox>

      <p className="text-2xs text-[var(--lume-text-muted)]">
        Massimo un coupon regalo + una gift card per fiche. Le gift card vengono applicate dopo gli altri sconti.
      </p>
    </div>
  );
}
