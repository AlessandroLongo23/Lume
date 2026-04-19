import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/gateway/superAdmins';
import { PlatformSidebar } from '@/lib/components/platform/PlatformSidebar';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isSuperAdmin(user.id))) notFound();

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-white font-sans">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex fixed top-0 bottom-0 left-0 bg-white dark:bg-card border-r border-border dark:border-border w-[240px] shadow-sm flex-col overflow-y-auto">
          <div className="px-4 pt-6 pb-4 flex flex-col flex-1 gap-1">
            <Link href="/platform" className="flex items-center gap-2 mb-6 px-2">
              <span className="text-base font-semibold tracking-tight">Lume</span>
              <span className="text-2xs font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary-active dark:bg-primary/20 dark:text-primary/40 uppercase tracking-wider">
                Platform
              </span>
            </Link>
            <PlatformSidebar />
          </div>
        </aside>

        <div className="ml-0 md:ml-[240px] min-h-screen w-full">
          <div className="px-4 md:p-8 py-6 md:py-8 min-h-screen">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
