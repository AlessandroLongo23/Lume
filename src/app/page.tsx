'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

import '@/lib/components/shared/landing/landing.css';
import { LandingHeader } from '@/lib/components/shared/landing/LandingHeader';
import { HeroSection } from '@/lib/components/shared/landing/HeroSection';
import { MethodSection } from '@/lib/components/shared/landing/MethodSection';
import { AboutSection } from '@/lib/components/shared/landing/AboutSection';
import { SubjectsSection } from '@/lib/components/shared/landing/SubjectsSection';
import { MigrationSection } from '@/lib/components/shared/landing/MigrationSection';
import { MarqueeStrip } from '@/lib/components/shared/landing/MarqueeStrip';
import { TestimonialsSection } from '@/lib/components/shared/landing/TestimonialsSection';
import { FaqSection } from '@/lib/components/shared/landing/FaqSection';
import { CtaSection } from '@/lib/components/shared/landing/CtaSection';
import { FooterSection } from '@/lib/components/shared/landing/FooterSection';

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const goToRegister = () => router.push('/register');

  return (
    <div className="lp-page">
      <LandingHeader session={session} />

      <main>
        {/* Hero: headline left, lede and actions right, calendar in a window */}
        <HeroSection onAuthClick={goToRegister} />

        {/* Features as a bento grid */}
        <MethodSection />

        {/* How it works: steps beside the product */}
        <AboutSection />

        {/* Bringing data from the old software */}
        <MigrationSection />

        {/* Comparison with the incumbent */}
        <SubjectsSection />

        {/* Pricing */}
        <MarqueeStrip onAuthClick={goToRegister} />

        {/* Real reviews only; hidden when there are none */}
        <TestimonialsSection />

        <FaqSection />

        <CtaSection onAuthClick={goToRegister} />
      </main>

      <FooterSection />
    </div>
  );
}
