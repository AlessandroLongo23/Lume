'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { X, Loader2, MessageSquare, Settings } from 'lucide-react';
import { adminRoutes } from '@/lib/const/data';
import { AdminHeader } from '@/lib/components/admin/AdminHeader';
import { StoreInitializer } from '@/lib/components/admin/StoreInitializer';
import { TrialWarningBanner } from '@/lib/components/admin/TrialWarningBanner';
import { useSubscriptionStore } from '@/lib/stores/subscription';
import { FeedbackModal } from '@/lib/components/shared/ui/FeedbackModal';
import { supabase } from '@/lib/supabase/client';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const routeNameMap: Record<string, string> = Object.fromEntries(
  adminRoutes.flatMap((group) => group.routes.map((r) => [r.url, r.name]))
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (routeNameMap[seg]) return routeNameMap[seg];
  }
  const adminIdx = segments.indexOf('admin');
  const seg = adminIdx >= 0 ? segments[adminIdx + 1] : segments[segments.length - 1];
  return seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : '';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isExpired = useSubscriptionStore((s) => s.isExpired);
  const isLoading = useSubscriptionStore((s) => s.isLoading);
  const salonName = useSubscriptionStore((s) => s.salonName);
  const logoUrl = useSubscriptionStore((s) => s.logoUrl);

  // Redirect expired users to subscribe page
  useEffect(() => {
    if (!isLoading && isExpired && pathname !== '/admin/subscribe') {
      router.replace('/admin/subscribe');
    }
  }, [isLoading, isExpired, pathname, router]);

  // Soft session-expiry handler: silently redirect to /login with a friendly toast
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        messagePopup.getState().show(
          'Per proteggere i tuoi dati, la sessione è scaduta. Effettua di nuovo l\'accesso.',
          'info',
          8000,
          'top-right',
          'Bentornato!'
        );
        router.replace('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-[#09090B] dark:text-white p-0 font-sans">
      <div className="h-full">
        <AdminHeader onMobileMenuOpen={() => setIsMobileSidebarOpen(true)} />

        <div className="flex">
          {/* Mobile Sidebar */}
          {isMobileSidebarOpen && (
            <>
              <div className="md:hidden fixed top-16 bottom-0 left-0 bg-white dark:bg-[#18181B] border-r border-[#E4E4E7] dark:border-[#27272A] z-50 shadow-sm w-64">
                <div className="p-6 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold tracking-tight truncate">{salonName || 'Menu'}</h2>
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      aria-label="Chiudi menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {adminRoutes.map((section) => (
                    <div key={section.title} className="flex flex-col gap-1">
                      <h3 className="text-sm font-medium">{section.title}</h3>
                      {section.routes.map((route) => {
                        const isActive = pathname.includes(route.url);
                        const Icon = route.icon;
                        return (
                          <Link
                            key={route.url}
                            href={`/admin/${route.url}`}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`flex items-center gap-3 font-medium transition-all duration-200 ease-in-out px-4 py-3 text-sm rounded-md ${isActive ? 'text-[#4F46E5] bg-[#EEF2FF] dark:text-[#818CF8] dark:bg-[#1E1B4B]/30' : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A]'}`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{route.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                  <hr className="border-zinc-500/25 my-2" />
                  <button
                    type="button"
                    onClick={() => { setIsMobileSidebarOpen(false); setIsFeedbackOpen(true); }}
                    className="flex items-center gap-3 font-medium transition-all duration-200 ease-in-out px-4 py-3 text-sm rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A] w-full"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Invia Feedback</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="md:hidden fixed inset-0 bg-black/40 z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Chiudi menu"
              />
            </>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden md:flex fixed top-16 bottom-0 left-0 bg-white dark:bg-[#18181B] border-r border-[#E4E4E7] dark:border-[#27272A] w-[72px] lg:w-[240px] shadow-sm flex-col overflow-y-auto">
            <div className="px-4 pt-6 pb-4 flex flex-col flex-1 gap-1">
              {salonName && (
                <div className="hidden lg:flex items-center gap-3 mb-4 min-w-0">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={salonName}
                      width={32}
                      height={32}
                      className="rounded-md object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 leading-none">
                        {getInitials(salonName)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white truncate">
                    {salonName}
                  </p>
                </div>
              )}
              {adminRoutes.map((section) => (
                <div key={section.title} className="flex flex-col gap-2 mb-4">
                  <p className="text-xs font-regular uppercase text-zinc-500">{section.title}</p>
                  <div className="flex flex-col gap-0.5">
                    {section.routes.map((route) => {
                      const isActive = pathname.includes(route.url);
                      const Icon = route.icon;
                      return (
                        <Link
                          key={route.url}
                          href={`/admin/${route.url}`}
                          className={`flex items-center justify-center lg:justify-start gap-0 lg:gap-3 transition-all duration-200 ease-in-out px-0 lg:px-3 py-2 text-sm rounded-md ${isActive ? 'text-[#4F46E5] bg-[#EEF2FF] dark:text-[#818CF8] dark:bg-[#1E1B4B]/30' : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A]'}`}
                        >
                          <Icon className="w-5 h-5" strokeWidth={1.5} />
                          <span className="hidden lg:inline">{route.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-auto pt-2 flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setIsFeedbackOpen(true)}
                  className="flex items-center justify-center lg:justify-start gap-0 lg:gap-3 transition-all duration-200 ease-in-out px-0 lg:px-3 py-2 text-sm rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A] w-full"
                >
                  <MessageSquare className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                  <span className="hidden lg:inline">Invia Feedback</span>
                </button>
                <Link
                  href="/admin/impostazioni"
                  className={`flex items-center justify-center lg:justify-start gap-0 lg:gap-3 transition-all duration-200 ease-in-out px-0 lg:px-3 py-2 text-sm rounded-md ${pathname.includes('impostazioni') ? 'text-[#4F46E5] bg-[#EEF2FF] dark:text-[#818CF8] dark:bg-[#1E1B4B]/30' : 'text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A]'}`}
                >
                  <Settings className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                  <span className="hidden lg:inline">Impostazioni</span>
                </Link>
              </div>
            </div>
          </div>

          <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

          <div className="ml-0 md:ml-[72px] lg:ml-[240px] min-h-screen w-full bg-[#FAFAFA] dark:bg-[#09090B]">
            <div className="px-4 md:p-6 pt-20 md:pt-24 min-h-screen">
              <StoreInitializer />
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : (
                <>
                  <TrialWarningBanner />
                  {children}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
