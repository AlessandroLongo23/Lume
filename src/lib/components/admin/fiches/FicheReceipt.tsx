'use client';

import { useMemo } from 'react';
import { Scissors, Package, Lightbulb, Gift, Tag, BadgePercent } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/services';
import { useProductsStore } from '@/lib/stores/products';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import type { FicheServiceDraft, FicheProductDraft } from '@/lib/types/FicheDraft';

export interface CouponDiscountLine {
  label: string;
  detail: string;
  amount: number;
}

interface FicheReceiptProps {
  clientName: string;
  ficheId?: string;
  datetime: Date;
  services: FicheServiceDraft[];
  products: FicheProductDraft[];
  subtotal: number;
  totalOverride: number | null;
  salonName: string;
  couponDiscounts?: CouponDiscountLine[];
}

function fmt(value: number) {
  return value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function makeZigzag(w: number, h: number, step: number, kind: 'top' | 'bottom'): string {
  const pts: string[] = [];
  if (kind === 'bottom') {
    pts.push(`M0,0 L0,${h}`);
    for (let x = 0; x < w; x += step) {
      pts.push(`L${x + step / 2},0 L${x + step},${h}`);
    }
    pts.push(`L${w},0 Z`);
  } else {
    pts.push(`M0,${h} L0,0`);
    for (let x = 0; x < w; x += step) {
      pts.push(`L${x + step / 2},${h} L${x + step},0`);
    }
    pts.push(`L${w},${h} Z`);
  }
  return pts.join(' ');
}

const TOP_ZIGZAG = makeZigzag(100, 8, 5, 'top');
const BOTTOM_ZIGZAG = makeZigzag(100, 8, 5, 'bottom');

function TornEdge({ kind }: { kind: 'top' | 'bottom' }) {
  return (
    <svg
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      className="block w-full h-2 fill-current"
      aria-hidden="true"
    >
      <path d={kind === 'top' ? TOP_ZIGZAG : BOTTOM_ZIGZAG} />
    </svg>
  );
}

export function FicheReceipt({
  clientName,
  ficheId,
  datetime,
  services,
  products,
  subtotal,
  totalOverride,
  salonName,
  couponDiscounts = [],
}: FicheReceiptProps) {
  const allServices = useServicesStore((s) => s.services);
  const allProducts = useProductsStore((s) => s.products);

  const serviceMap = useMemo(() => new Map(allServices.map((s) => [s.id, s])), [allServices]);
  const productMap = useMemo(() => new Map(allProducts.map((p) => [p.id, p])), [allProducts]);

  const couponsTotal = couponDiscounts.reduce((acc, c) => acc + c.amount, 0);
  const subtotalAfterCoupons = Math.max(0, subtotal - couponsTotal);
  const hasOverride = totalOverride !== null && Math.round(totalOverride * 100) !== Math.round(subtotalAfterCoupons * 100);
  const finalTotal = totalOverride ?? subtotalAfterCoupons;

  return (
    <div
      className="text-receipt p-4"
      style={{ filter: 'drop-shadow(0 4px 10px var(--shadow-color))' }}
    >
      <TornEdge kind="top" />

      <div className="bg-receipt tabular-nums text-sm">
        {/* Salon name */}
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-sm font-medium text-[var(--lume-text)] uppercase tracking-widest leading-tight">
            {salonName}
          </p>
          <p className="text-2xs text-[var(--lume-text-muted)] mt-1.5">
            {datetime.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}
            {datetime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Client + receipt ID */}
        <div className="mx-4 border-t border-dashed border-line pt-3 pb-3 font-sans grid grid-cols-2 gap-x-2">
          <div>
            <p className="text-2xs font-medium text-[var(--lume-text-muted)]">Cliente</p>
            <p className="text-xs text-[var(--lume-text)] mt-0.5 truncate">{clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xs font-medium text-[var(--lume-text-muted)]">N. scontrino</p>
            <p className="text-xs text-[var(--lume-text)] mt-0.5 tabular-nums">
              {ficheId ? ficheId.slice(-8).toUpperCase() : '—'}
            </p>
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="mx-4 border-t border-dashed border-line pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Scissors className="size-3 text-[var(--lume-text-muted)]" />
              <span className="text-2xs font-medium text-[var(--lume-text-muted)] font-sans">Servizi</span>
            </div>
            {services.map((fs, i) => {
              const service = serviceMap.get(fs.service_id);
              const isDiscounted = fs.final_price < fs.list_price;
              const isAbbonamento = !!fs.abbonamento_id && fs.final_price === 0;
              const isGift = !isAbbonamento && fs.final_price === 0 && fs.list_price > 0;
              return (
                <div key={fs.id ?? `svc-${i}`} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-xs text-[var(--lume-text)] truncate font-sans">{fs.name || service?.name || 'Servizio'}</span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {isDiscounted && (
                      <span className="text-2xs text-[var(--lume-text-muted)] line-through">€ {fmt(fs.list_price)}</span>
                    )}
                    {isAbbonamento ? (
                      <Tooltip label="Coperto da abbonamento">
                        <span className="inline-flex items-center gap-1 text-success-strong" aria-label="Coperto da abbonamento">
                          <BadgePercent className="size-3.5" />
                          <span className="text-2xs font-medium uppercase tracking-wide">Abb.</span>
                        </span>
                      </Tooltip>
                    ) : isGift ? (
                      <Tooltip label="Omaggio">
                        <span className="inline-flex items-center text-warning-strong" aria-label="Omaggio">
                          <Gift className="size-3.5" />
                        </span>
                      </Tooltip>
                    ) : (
                      <span className={`text-xs font-medium shrink-0 ${isDiscounted ? 'text-success-strong' : 'text-[var(--lume-text)]'}`}>
                        € {fmt(fs.final_price)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div className="mx-4 border-t border-dashed border-line pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="size-3 text-[var(--lume-text-muted)]" />
              <span className="text-2xs font-medium text-[var(--lume-text-muted)] font-sans">Prodotti</span>
            </div>
            {products.map((fp, i) => {
              const product = productMap.get(fp.product_id);
              const listTotal = fp.list_price * fp.quantity;
              const finalTotalLine = fp.final_price;
              const isDiscounted = fp.final_price < listTotal;
              const isGift = fp.final_price === 0 && fp.list_price > 0;
              return (
                <div key={fp.id ?? `prod-${i}`} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-xs text-[var(--lume-text)] truncate font-sans">
                    {product?.name ?? fp.name ?? 'Prodotto'}
                    {fp.quantity > 1 && (
                      <span className="text-[var(--lume-text-muted)] ml-1">×{fp.quantity}</span>
                    )}
                  </span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {isDiscounted && (
                      <span className="text-2xs text-[var(--lume-text-muted)] line-through">€ {fmt(listTotal)}</span>
                    )}
                    {isGift ? (
                      <Tooltip label="Omaggio">
                        <span className="inline-flex items-center text-warning-strong" aria-label="Omaggio">
                          <Gift className="size-3.5" />
                        </span>
                      </Tooltip>
                    ) : (
                      <span className={`text-xs font-medium shrink-0 ${isDiscounted ? 'text-success-strong' : 'text-[var(--lume-text)]'}`}>
                        € {fmt(finalTotalLine)}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Coupons */}
        {couponDiscounts.length > 0 && (
          <div className="mx-4 border-t border-dashed border-line pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="size-3 text-[var(--lume-text-muted)]" />
              <span className="text-2xs font-medium text-[var(--lume-text-muted)] font-sans">Coupon</span>
            </div>
            {couponDiscounts.map((c, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 py-0.5">
                <span className="text-xs text-[var(--lume-text)] truncate font-sans">
                  {c.label}
                  <span className="text-[var(--lume-text-muted)] ml-1">({c.detail})</span>
                </span>
                <span className="text-xs font-medium shrink-0 text-success-strong">
                  − € {fmt(c.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total section */}
        <div className="mx-4 border-t border-line pt-3 pb-3 font-sans">
          {(hasOverride || couponsTotal > 0) && (
            <div className="flex items-baseline justify-between py-0.5">
              <span className="text-2xs font-medium text-[var(--lume-text-muted)]">Subtotale</span>
              <span className="text-xs text-[var(--lume-text-muted)] line-through">€ {fmt(subtotal)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-2xs font-medium text-[var(--lume-text-secondary)]">Totale</span>
            <span className={`text-base font-medium ${(hasOverride || couponsTotal > 0) ? 'text-success-strong' : 'text-[var(--lume-text)]'}`}>
              € {fmt(finalTotal)}
            </span>
          </div>
        </div>

        {/* Lume branding footer */}
        <div className="border-t border-dashed border-line py-3 flex items-center justify-center gap-1.5 font-sans">
          <Lightbulb className="size-3 text-[var(--lume-accent)]" strokeWidth={2.25} />
          <span className="text-2xs text-[var(--lume-text-muted)]">
            Gestito con <span className="text-[var(--lume-accent)] font-medium">Lume.</span>
          </span>
        </div>
      </div>

      <TornEdge kind="bottom" />
    </div>
  );
}
