'use client';

import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader } from '@/lib/components/shared/ui/PageHeader';
import { SettingsSidebar } from '@/lib/components/admin/settings/SettingsSidebar';
import { RoleBanner } from '@/lib/components/admin/settings/RoleBanner';

export default function ImpostazioniLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <PageHeader
        title="Impostazioni"
        subtitle="Gestisci le preferenze del tuo profilo, salone e account."
        icon={SettingsIcon}
      />
      <RoleBanner />
      <div className="flex gap-8 items-start">
        <SettingsSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
