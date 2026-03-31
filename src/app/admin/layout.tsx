'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { adminRoutes } from '@/lib/const/data';
import { AdminHeader } from '@/lib/components/admin/AdminHeader';
import { StoreInitializer } from '@/lib/components/admin/StoreInitializer';
import { useTheme } from '@/lib/components/shared/ui/theme/ThemeProvider';

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
  const pathname = usePathname();
  const { theme } = useTheme();

  const bgImage = theme === 'dark'
    ? "bg-[url('/brand/marble-black.jpg')]"
    : "bg-[url('/brand/marble-white.jpg')]";

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0A0A0A] text-[#374151] dark:text-white p-0 font-sans">
      <div className="h-full">
        <AdminHeader user={null} onMobileMenuOpen={() => setIsMobileSidebarOpen(true)} />

        <div className="flex">
          {/* Mobile Sidebar */}
          {isMobileSidebarOpen && (
            <>
              <div className="md:hidden fixed top-16 bottom-0 left-0 bg-white dark:bg-[#121212] border-r border-[#E5E7EB] dark:border-[#2A2A2A] z-50 shadow-sm w-64">
                <div className="p-6 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold">Menu</h2>
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#F3F4F6] dark:hover:bg-[#1E1E1E]"
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
                            className={`flex items-center gap-3 font-medium transition-all duration-200 ease-in-out px-4 py-3 text-sm rounded-md ${isActive ? 'text-[#15803D] bg-[#F0FDF4] dark:text-[#22C55E] dark:bg-[#1E1E1E]' : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB] dark:text-[#A0A0A0] dark:hover:text-white dark:hover:bg-[#1E1E1E]'}`}
                          >
                            <Icon className="w-5 h-5" />
                            <span>{route.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
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
          <div className="hidden md:flex fixed top-16 bottom-0 left-0 bg-white dark:bg-[#121212] border-r border-[#E5E7EB] dark:border-[#2A2A2A] w-[72px] lg:w-[240px] shadow-sm flex-col overflow-y-auto">
            <div className="p-6 space-y-1">
              {adminRoutes.map((section, i) => (
                <div key={section.title} className="flex flex-col gap-4">
                  <p className="text-xs font-regular uppercase text-zinc-500">{section.title}</p>
                  <div className="flex flex-col gap-1">
                    {section.routes.map((route) => {
                      const isActive = pathname.includes(route.url);
                      const Icon = route.icon;
                      return (
                        <Link
                          key={route.url}
                          href={`/admin/${route.url}`}
                          className={`flex items-center justify-center lg:justify-start gap-0 lg:gap-3 transition-all duration-200 ease-in-out px-0 lg:px-4 py-3 text-sm rounded-md ${isActive ? 'text-[#75583e] bg-[#f7f1eb] dark:text-[#22C55E] dark:bg-[#1E1E1E]' : 'text-[#6B7280] hover:text-[#374151] hover:bg-[#F9FAFB] dark:text-[#A0A0A0] dark:hover:text-white dark:hover:bg-[#1E1E1E]'}`}
                        >
                          <Icon className="w-5 h-5" strokeWidth={1.5} />
                          <span className="hidden lg:inline">{route.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {i < adminRoutes.length - 1 && <hr className="border-zinc-500/25 my-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className={`ml-0 md:ml-[72px] lg:ml-[240px] ${bgImage} bg-cover bg-center min-h-screen w-full`}>
            <div className="bg-white/80 dark:bg-black/80 px-4 md:p-6 pt-20 md:pt-24 min-h-screen">
              <StoreInitializer />
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
