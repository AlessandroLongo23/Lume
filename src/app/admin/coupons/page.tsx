'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tag, Gift, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useCouponsStore } from '@/lib/stores/coupons';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { EmptyState } from '@/lib/components/shared/ui/EmptyState';
import { TableSkeleton } from '@/lib/components/shared/ui/TableSkeleton';
import { NumberBadge } from '@/lib/components/shared/ui/NumberBadge';
import { DropdownMenu } from '@/lib/components/shared/ui/DropdownMenu';
import { Button } from '@/lib/components/shared/ui/Button';
import { DeleteAllModal } from '@/lib/components/shared/ui/modals/DeleteAllModal';
import { CouponsTable } from '@/lib/components/admin/coupons/CouponsTable';
import { GiftCouponModal } from '@/lib/components/admin/coupons/GiftCouponModal';
import { GiftCardModal } from '@/lib/components/admin/coupons/GiftCardModal';
import { DeleteCouponModal } from '@/lib/components/admin/coupons/DeleteCouponModal';
import type { Coupon } from '@/lib/types/Coupon';
import { useOrderedTabs } from '@/lib/hooks/useOrderedTabs';
import { TAB_DEFAULTS } from '@/lib/const/tab-defaults';

type Tab = 'gift' | 'gift_card';

const TAB_META: Record<Tab, { label: string; icon: React.ElementType }> = {
  gift: { label: 'Coupon regalo', icon: Gift },
  gift_card: { label: 'Gift card', icon: CreditCard },
};

const DEFAULT_ORDER = TAB_DEFAULTS.coupons as readonly Tab[];

export default function CouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { visible } = useOrderedTabs<Tab>('coupons', DEFAULT_ORDER);
  const [userTab, setUserTab] = useState<Tab | null>(null);
  const activeTab: Tab = userTab && visible.includes(userTab) ? userTab : visible[0];
  const setActiveTab = (t: Tab) => setUserTab(t);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [commandTarget, setCommandTarget] = useState<Coupon | null>(null);

  const coupons = useCouponsStore((s) => s.coupons);
  const isLoading = useCouponsStore((s) => s.isLoading);
  const deleteAllCoupons = useCouponsStore((s) => s.deleteAllCoupons);

  const visibleCoupons = useMemo(
    () => coupons.filter((c) => c.kind === activeTab),
    [coupons, activeTab],
  );

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setActiveTab('gift');
      setGiftModalOpen(true);
      router.replace('/admin/coupons');
      return;
    }
    const deleteId = searchParams.get('delete');
    if (deleteId) {
      const coupon = useCouponsStore.getState().coupons.find((c) => c.id === deleteId);
      if (coupon) setCommandTarget(coupon);
      router.replace('/admin/coupons');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      <GiftCouponModal isOpen={giftModalOpen} onClose={() => setGiftModalOpen(false)} />
      <GiftCardModal isOpen={giftCardModalOpen} onClose={() => setGiftCardModalOpen(false)} />
      <DeleteCouponModal
        isOpen={commandTarget !== null}
        onClose={() => setCommandTarget(null)}
        coupon={commandTarget}
      />
      <DeleteAllModal
        isOpen={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        entityLabel="coupon"
        count={coupons.length}
        cascadeNotice={
          <>
            Verranno eliminati <strong>coupon regalo e gift card</strong>, insieme allo storico
            delle redemption. I clienti non potranno più riscattare i loro buoni.
          </>
        }
        onConfirm={deleteAllCoupons}
      />

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        <PageHeader
          title="Coupon e gift card"
          subtitle="Sconti da attivare, regali da stampare."
          icon={Tag}
          actions={
            <>
              {activeTab === 'gift' ? (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setGiftModalOpen(true)}>
                  Nuovo coupon
                </Button>
              ) : (
                <Button variant="primary" leadingIcon={Plus} onClick={() => setGiftCardModalOpen(true)}>
                  Vendi gift card
                </Button>
              )}
              {coupons.length > 0 && (
                <DropdownMenu items={[
                  { label: 'Elimina tutti', icon: Trash2, onClick: () => setShowDeleteAll(true), destructive: true },
                ]} />
              )}
            </>
          }
        />

        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
          {visible.map((id) => {
            const { label, icon: Icon } = TAB_META[id];
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
                  <NumberBadge value={count} variant={isActive ? 'primary' : 'neutral'} size="md" />
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : visibleCoupons.length === 0 ? (
          activeTab === 'gift' ? (
            <EmptyState
              icon={Gift}
              title="Nessun coupon regalo"
              description="Crea il primo coupon: uno sconto da regalare a chi ti porta nuovi clienti."
              action={{ label: 'Nuovo coupon', icon: Plus, onClick: () => setGiftModalOpen(true) }}
            />
          ) : (
            <EmptyState
              icon={CreditCard}
              title="Nessuna gift card"
              description="Vendi la prima gift card: un buono prepagato che il cliente può regalare a un'altra persona."
              action={{ label: 'Vendi gift card', icon: Plus, onClick: () => setGiftCardModalOpen(true) }}
            />
          )
        ) : (
          <CouponsTable coupons={visibleCoupons} variant={activeTab} />
        )}
      </div>
    </>
  );
}
