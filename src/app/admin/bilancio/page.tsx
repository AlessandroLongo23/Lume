'use client';

import { useState } from 'react';
import { Wallet, LayoutDashboard, Receipt, Target } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { BilancioPanoramicaTab } from '@/lib/components/admin/bilancio/BilancioPanoramicaTab';
import { BilancioSpeseTab } from '@/lib/components/admin/bilancio/BilancioSpeseTab';
import { BilancioObiettiviTab } from '@/lib/components/admin/bilancio/BilancioObiettiviTab';

type Tab = 'panoramica' | 'spese' | 'obiettivi';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'panoramica', label: 'Panoramica', icon: LayoutDashboard },
  { id: 'spese', label: 'Spese', icon: Receipt },
  { id: 'obiettivi', label: 'Obiettivi', icon: Target },
];

export default function BilancioPage() {
  const [activeTab, setActiveTab] = useState<Tab>('panoramica');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bilancio" icon={Wallet} />

      {/* Tab nav */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
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
