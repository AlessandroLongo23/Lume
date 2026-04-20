'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LineChart, MessageSquare, X } from 'lucide-react';
import { PlatformHeader } from './PlatformHeader';

const LINKS = [
  { href: '/platform/salons',   label: 'Saloni',   icon: Building2 },
  { href: '/platform/metrics',  label: 'Metriche', icon: LineChart },
  { href: '/platform/feedback', label: 'Feedback', icon: MessageSquare },
];

interface PlatformShellProps {
  firstName: string;
  lastName:  string;
  email:     string;
  children:  React.ReactNode;
}

export function PlatformShell({ firstName, lastName, email, children }: PlatformShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground dark:text-white p-0 font-sans">
      <div className="h-full">
        <PlatformHeader
          firstName={firstName}
          lastName={lastName}
          email={email}
          onMobileMenuOpen={() => setIsMobileSidebarOpen(true)}
        />

        <div className="flex">
          {/* Mobile Sidebar */}
          {isMobileSidebarOpen && (
            <>
              <div className="md:hidden fixed top-16 bottom-0 left-0 bg-white dark:bg-card border-r border-border dark:border-border z-50 shadow-sm w-64">
                <div className="p-6 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold tracking-tight truncate">Platform</h2>
                    <button
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted dark:hover:bg-muted"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      aria-label="Chiudi menu"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {LINKS.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname.startsWith(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsMobileSidebarOpen(false)}
                          className={`flex items-center gap-3 font-medium transition-all duration-200 ease-in-out px-4 py-3 text-sm rounded-md ${isActive ? 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:text-white dark:hover:bg-muted'}`}
                        >
                          <Icon className="w-5 h-5" strokeWidth={1.5} />
                          <span>{label}</span>
                        </Link>
                      );
                    })}
                  </div>
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
          <div className="hidden md:flex fixed top-16 bottom-0 left-0 bg-white dark:bg-card border-r border-border dark:border-border w-[72px] lg:w-[240px] shadow-sm flex-col overflow-y-auto">
            <div className="px-4 pt-6 pb-4 flex flex-col flex-1 gap-1">
              <div className="flex flex-col gap-0.5">
                {LINKS.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center justify-center lg:justify-start gap-0 lg:gap-3 transition-all duration-200 ease-in-out px-0 lg:px-3 py-2 text-sm rounded-md ${isActive ? 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:text-muted-foreground dark:hover:text-white dark:hover:bg-muted'}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                      <span className="hidden lg:inline">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="ml-0 md:ml-[72px] lg:ml-[240px] min-h-screen w-full bg-background dark:bg-background">
            <div className="px-4 md:p-6 pt-20 md:pt-24 min-h-screen">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
