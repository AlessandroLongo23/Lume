'use client';

import { useEffect, useState, useMemo } from 'react';
import { Tag, Gift, CreditCard, Plus } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { CouponsTable } from '@/lib/components/admin/coupons/CouponsTable';
import { GiftCouponModal } from '@/lib/components/admin/coupons/GiftCouponModal';
import { GiftCardModal } from '@/lib/components/admin/coupons/GiftCardModal';
import { DeleteCouponModal } from '@/lib/components/admin/coupons/DeleteCouponModal';
import { onCommand } from '@/lib/components/shell/commandMenu/events';
import type { Coupon } from '@/lib/types/Coupon';

type Tab = 'gift' | 'gift_card';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'gift', label: 'Coupon regalo', icon: Gift },
  { id: 'gift_card', label: 'Gift card', icon: CreditCard },
];

export default function CouponsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('gift');
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);
  const [commandTarget, setCommandTarget] = useState<Coupon | null>(null);

  const coupons = useCouponsStore((s) => s.coupons);
  const isLoading = useCouponsStore((s) => s.isLoading);

  const visibleCoupons = useMemo(
    () => coupons.filter((c) => c.kind === activeTab),
    [coupons, activeTab],
  );

  useEffect(() => {
    return onCommand('coupon', (detail) => {
      if (detail.kind === 'open-add') {
        setActiveTab('gift');
        setGiftModalOpen(true);
        return;
      }
      if (detail.kind === 'open-delete') {
        const coupon = useCouponsStore.getState().coupons.find((c) => c.id === detail.id);
        if (coupon) setCommandTarget(coupon);
      }
    });
  }, []);

  return (
    <>
      <GiftCouponModal isOpen={giftModalOpen} onClose={() => setGiftModalOpen(false)} />
      <GiftCardModal isOpen={giftCardModalOpen} onClose={() => setGiftCardModalOpen(false)} />
      <DeleteCouponModal
        isOpen={commandTarget !== null}
        onClose={() => setCommandTarget(null)}
        coupon={commandTarget}
      />

      <div className="flex flex-col gap-6">
        <PageHeader
          title="Coupon e gift card"
          subtitle="Sconti da attivare, regali da stampare."
          icon={Tag}
          actions={
            activeTab === 'gift' ? (
              <button
                onClick={() => setGiftModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Nuovo coupon
              </button>
            ) : (
              <button
                onClick={() => setGiftCardModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-black dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
              >
                <Plus className="size-4" />
                Vendi gift card
              </button>
            )
          }
        />

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const count = coupons.filter((c) => c.kind === id).length;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'border-primary text-primary-hover dark:text-primary/70'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
                }`}
              >
                <Icon className="size-4" />
                {label}
                {count > 0 && (
                  <span className="inline-flex items-center justify-center size-5 rounded-full text-2xs font-semibold bg-primary/15 text-primary">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? <TableSkeleton /> : <CouponsTable coupons={visibleCoupons} variant={activeTab} />}
      </div>
    </>
  );
}
