import type { Coupon } from '@/lib/types/Coupon';
import type { Service } from '@/lib/types/Service';
import type { Product } from '@/lib/types/Product';
import type { FicheServiceDraft, FicheProductDraft } from '@/lib/types/FicheDraft';

interface ServiceLine extends FicheServiceDraft {
  category_id?: string;
}

interface ProductLine extends FicheProductDraft {
  product_category_id?: string;
}

/**
 * Decorates fiche line items with their category ids (resolved against the
 * services / products catalogue) so eligibility checks can look at categories
 * without needing to re-query for every coupon.
 */
export function decorateLines(
  services: FicheServiceDraft[],
  products: FicheProductDraft[],
  catalogServices: Service[],
  catalogProducts: Product[],
): { services: ServiceLine[]; products: ProductLine[] } {
  const svcMap = new Map(catalogServices.map((s) => [s.id, s]));
  const prdMap = new Map(catalogProducts.map((p) => [p.id, p]));
  return {
    services: services.map((s) => ({ ...s, category_id: svcMap.get(s.service_id)?.category_id })),
    products: products.map((p) => ({ ...p, product_category_id: prdMap.get(p.product_id)?.product_category_id })),
  };
}

function lineMatches(
  serviceIds: string[] | null | undefined,
  serviceCategoryIds: string[] | null | undefined,
  productIds: string[] | null | undefined,
  productCategoryIds: string[] | null | undefined,
  line: { service_id?: string; product_id?: string; category_id?: string; product_category_id?: string },
): boolean {
  // No scope at all → applies to everything
  const hasAny =
    !!serviceIds?.length ||
    !!serviceCategoryIds?.length ||
    !!productIds?.length ||
    !!productCategoryIds?.length;
  if (!hasAny) return true;

  if (line.service_id) {
    if (serviceIds?.includes(line.service_id)) return true;
    if (line.category_id && serviceCategoryIds?.includes(line.category_id)) return true;
  }
  if (line.product_id) {
    if (productIds?.includes(line.product_id)) return true;
    if (line.product_category_id && productCategoryIds?.includes(line.product_category_id)) return true;
  }
  return false;
}

/** True when at least one line item on the fiche falls within the coupon's scope. */
export function couponMatchesFiche(
  coupon: Coupon,
  services: ServiceLine[],
  products: ProductLine[],
): boolean {
  for (const s of services) {
    if (lineMatches(coupon.scope_service_ids, coupon.scope_service_category_ids, null, null, s)) return true;
  }
  for (const p of products) {
    if (lineMatches(null, null, coupon.scope_product_ids, coupon.scope_product_category_ids, p)) return true;
  }
  return false;
}

/** Sum of `final_price` (× quantity for products) across line items eligible under the coupon's scope. */
export function eligibleSubtotal(
  coupon: Coupon,
  services: ServiceLine[],
  products: ProductLine[],
): number {
  let total = 0;
  for (const s of services) {
    if (lineMatches(coupon.scope_service_ids, coupon.scope_service_category_ids, null, null, s)) {
      total += s.final_price;
    }
  }
  for (const p of products) {
    if (lineMatches(null, null, coupon.scope_product_ids, coupon.scope_product_category_ids, p)) {
      total += p.final_price * p.quantity;
    }
  }
  return total;
}

/**
 * Returns the € amount the coupon should deduct from the bill, given the
 * eligible-line subtotal it is being applied against. Caller is responsible
 * for ordering: percentage/fixed coupons should be computed BEFORE gift
 * cards, then the gift card is computed against the post-discount total.
 */
export function computeDiscount(coupon: Coupon, applicableSubtotal: number): number {
  if (applicableSubtotal <= 0) return 0;

  if (coupon.kind === 'gift_card') {
    const remaining = coupon.remaining_value ?? 0;
    return Math.min(remaining, applicableSubtotal);
  }

  if (coupon.discount_type === 'fixed') {
    return Math.min(coupon.discount_value ?? 0, applicableSubtotal);
  }
  if (coupon.discount_type === 'percent') {
    const pct = coupon.discount_value ?? 0;
    return Math.min((applicableSubtotal * pct) / 100, applicableSubtotal);
  }
  // free_item — caller resolves which specific line is zeroed
  return 0;
}

/**
 * For a 'free_item' coupon, returns the unit price of the eligible line item
 * with the highest unit price (which is the value the coupon "is worth" on
 * this fiche). Returns 0 if no eligible item is on the fiche.
 */
export function freeItemDiscount(
  coupon: Coupon,
  services: ServiceLine[],
  products: ProductLine[],
): number {
  if (coupon.discount_type !== 'free_item') return 0;
  if (coupon.free_item_kind === 'service') {
    const candidate = services
      .filter((s) => s.service_id === coupon.free_item_id)
      .reduce((max, s) => Math.max(max, s.final_price), 0);
    return candidate;
  }
  if (coupon.free_item_kind === 'product') {
    const candidate = products
      .filter((p) => p.product_id === coupon.free_item_id)
      .reduce((max, p) => Math.max(max, p.final_price), 0);
    return candidate;
  }
  return 0;
}
