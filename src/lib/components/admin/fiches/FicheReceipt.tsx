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

      <div className="bg-receipt font-mono text-sm">
        {/* Salon name */}
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-tight">
            {salonName}
          </p>
          <p className="text-2xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            {datetime.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' · '}
            {datetime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Client + receipt ID */}
        <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3 font-sans grid grid-cols-2 gap-x-2">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Cliente</p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 truncate">{clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">N. scontrino</p>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono">
              {ficheId ? ficheId.slice(-8).toUpperCase() : '—'}
            </p>
          </div>
        </div>

        {/* Services */}
        {services.length > 0 && (
          <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Scissors className="size-3 text-zinc-400 dark:text-zinc-500" />
              <span className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Servizi</span>
            </div>
            {services.map((fs, i) => {
              const service = serviceMap.get(fs.service_id);
              const isDiscounted = fs.final_price < fs.list_price;
              const isAbbonamento = !!fs.abbonamento_id && fs.final_price === 0;
              const isGift = !isAbbonamento && fs.final_price === 0 && fs.list_price > 0;
              return (
                <div key={fs.id ?? `svc-${i}`} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-sans">{fs.name || service?.name || 'Servizio'}</span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {isDiscounted && (
                      <span className="text-2xs text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(fs.list_price)}</span>
                    )}
                    {isAbbonamento ? (
                      <Tooltip label="Coperto da abbonamento">
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400" aria-label="Coperto da abbonamento">
                          <BadgePercent className="size-3.5" />
                          <span className="text-2xs font-semibold uppercase tracking-wide">Abb.</span>
                        </span>
                      </Tooltip>
                    ) : isGift ? (
                      <Tooltip label="Omaggio">
                        <span className="inline-flex items-center text-pink-500 dark:text-pink-400" aria-label="Omaggio">
                          <Gift className="size-3.5" />
                        </span>
                      </Tooltip>
                    ) : (
                      <span className={`text-xs font-medium shrink-0 ${isDiscounted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
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
          <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Package className="size-3 text-zinc-400 dark:text-zinc-500" />
              <span className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Prodotti</span>
            </div>
            {products.map((fp, i) => {
              const product = productMap.get(fp.product_id);
              const listTotal = fp.list_price * fp.quantity;
              const finalTotalLine = fp.final_price * fp.quantity;
              const isDiscounted = fp.final_price < fp.list_price;
              const isGift = fp.final_price === 0 && fp.list_price > 0;
              return (
                <div key={fp.id ?? `prod-${i}`} className="flex items-baseline justify-between gap-2 py-0.5">
                  <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-sans">
                    {product?.name ?? fp.name ?? 'Prodotto'}
                    {fp.quantity > 1 && (
                      <span className="text-zinc-400 dark:text-zinc-500 ml-1">×{fp.quantity}</span>
                    )}
                  </span>
                  <span className="flex items-baseline gap-1.5 shrink-0">
                    {isDiscounted && (
                      <span className="text-2xs text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(listTotal)}</span>
                    )}
                    {isGift ? (
                      <Tooltip label="Omaggio">
                        <span className="inline-flex items-center text-pink-500 dark:text-pink-400" aria-label="Omaggio">
                          <Gift className="size-3.5" />
                        </span>
                      </Tooltip>
                    ) : (
                      <span className={`text-xs font-medium shrink-0 ${isDiscounted ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
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
          <div className="mx-4 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-3 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="size-3 text-zinc-400 dark:text-zinc-500" />
              <span className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-sans">Coupon</span>
            </div>
            {couponDiscounts.map((c, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 py-0.5">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-sans">
                  {c.label}
                  <span className="text-zinc-400 dark:text-zinc-500 ml-1">({c.detail})</span>
                </span>
                <span className="text-xs font-medium shrink-0 text-emerald-600 dark:text-emerald-400">
                  − € {fmt(c.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Total section */}
        <div className="mx-4 border-t border-zinc-200 dark:border-zinc-700 pt-3 pb-3 font-sans">
          {(hasOverride || couponsTotal > 0) && (
            <div className="flex items-baseline justify-between py-0.5">
              <span className="text-2xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Subtotale</span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500 line-through">€ {fmt(subtotal)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-2xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Totale</span>
            <span className={`text-base font-bold ${(hasOverride || couponsTotal > 0) ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
              € {fmt(finalTotal)}
            </span>
          </div>
        </div>

        {/* Lume branding footer */}
        <div className="border-t border-dashed border-zinc-200 dark:border-zinc-700 py-3 flex items-center justify-center gap-1.5 font-sans">
          <Lightbulb className="size-3 text-primary" strokeWidth={2.25} />
          <span className="text-2xs text-zinc-400 dark:text-zinc-500">
            Gestito con <span className="text-primary font-semibold">Lume.</span>
          </span>
        </div>
      </div>

      <TornEdge kind="bottom" />
    </div>
  );
}
