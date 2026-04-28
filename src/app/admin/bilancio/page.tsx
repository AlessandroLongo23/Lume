'use client';

import { useState } from 'react';
import { Wallet, LayoutDashboard, Receipt, Target } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { BilancioPanoramicaTab } from '@/lib/components/admin/bilancio/BilancioPanoramicaTab';
import { BilancioSpeseTab } from '@/lib/components/admin/bilancio/BilancioSpeseTab';
import { BilancioObiettiviTab } from '@/lib/components/admin/bilancio/BilancioObiettiviTab';
import { useOrderedTabs } from '@/lib/hooks/useOrderedTabs';
import { TAB_DEFAULTS } from '@/lib/const/tab-defaults';

type Tab = 'panoramica' | 'spese' | 'obiettivi';

const TAB_META: Record<Tab, { label: string; icon: React.ElementType }> = {
  panoramica: { label: 'Panoramica', icon: LayoutDashboard },
  spese: { label: 'Spese', icon: Receipt },
  obiettivi: { label: 'Obiettivi', icon: Target },
};

const DEFAULT_ORDER = TAB_DEFAULTS.bilancio as readonly Tab[];

export default function BilancioPage() {
  const { visible } = useOrderedTabs<Tab>('bilancio', DEFAULT_ORDER);
  const [userTab, setUserTab] = useState<Tab | null>(null);
  const activeTab: Tab = userTab && visible.includes(userTab) ? userTab : visible[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bilancio"
        subtitle="Quanto entra, quanto esce, dove stai andando."
        icon={Wallet}
      />

      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {visible.map((id) => {
          const { label, icon: Icon } = TAB_META[id];
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setUserTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-primary text-primary-hover dark:text-primary/70'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'panoramica' && <BilancioPanoramicaTab />}
      {activeTab === 'spese' && <BilancioSpeseTab />}
      {activeTab === 'obiettivi' && <BilancioObiettiviTab />}
    </div>
  );
}
