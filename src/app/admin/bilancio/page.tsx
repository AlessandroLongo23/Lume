'use client';

import { useState } from 'react';
import { LayoutDashboard, Receipt, Target } from 'lucide-react';
import { TabBar, TabButton } from '@/lib/components/shared/ui/Tabs';
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
      />

      <TabBar label="Sezioni del bilancio">
        {visible.map((id) => {
          const { label, icon: Icon } = TAB_META[id];
          return (
            <TabButton key={id} active={activeTab === id} onClick={() => setUserTab(id)}>
              <Icon />
              {label}
            </TabButton>
          );
        })}
      </TabBar>

      {activeTab === 'panoramica' && <BilancioPanoramicaTab />}
      {activeTab === 'spese' && <BilancioSpeseTab />}
      {activeTab === 'obiettivi' && <BilancioObiettiviTab />}
    </div>
  );
}
