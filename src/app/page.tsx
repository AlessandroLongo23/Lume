'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

import { LandingHeader } from '@/lib/components/shared/landing/LandingHeader';
import { HeroSection } from '@/lib/components/shared/landing/HeroSection';
import { MarqueeStrip } from '@/lib/components/shared/landing/MarqueeStrip';
import { AboutSection } from '@/lib/components/shared/landing/AboutSection';
import { MethodSection } from '@/lib/components/shared/landing/MethodSection';
import { SubjectsSection } from '@/lib/components/shared/landing/SubjectsSection';
import { TestimonialsSection } from '@/lib/components/shared/landing/TestimonialsSection';
import { FooterSection } from '@/lib/components/shared/landing/FooterSection';
import { AuthModal } from '@/lib/components/shared/ui/modals/AuthModal';

export default function LandingPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll('.section-enter').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <LandingHeader session={session} onAuthClick={() => setIsAuthModalOpen(true)} />

      <main>
        <HeroSection onContactClick={() => setIsContactModalOpen(true)} />
        <MarqueeStrip />
        <AboutSection />
        <MethodSection />
        <SubjectsSection />
        <TestimonialsSection />
        <FooterSection onContactClick={() => setIsContactModalOpen(true)} />
      </main>
    </>
  );
}
