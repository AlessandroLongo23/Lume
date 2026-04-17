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
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-[#09090B] dark:text-white font-sans">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex fixed top-0 bottom-0 left-0 bg-white dark:bg-[#18181B] border-r border-[#E4E4E7] dark:border-[#27272A] w-[240px] shadow-sm flex-col overflow-y-auto">
          <div className="px-4 pt-6 pb-4 flex flex-col flex-1 gap-1">
            <Link href="/platform" className="flex items-center gap-2 mb-6 px-2">
              <span className="text-base font-semibold tracking-tight">Lume</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 uppercase tracking-wider">
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
