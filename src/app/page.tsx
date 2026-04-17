'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

import { LandingHeader } from '@/lib/components/shared/landing/LandingHeader';
import { HeroSection } from '@/lib/components/shared/landing/HeroSection';
import { MethodSection } from '@/lib/components/shared/landing/MethodSection';
import { AboutSection } from '@/lib/components/shared/landing/AboutSection';
import { SubjectsSection } from '@/lib/components/shared/landing/SubjectsSection';
import { MigrationSection } from '@/lib/components/shared/landing/MigrationSection';
import { MarqueeStrip } from '@/lib/components/shared/landing/MarqueeStrip';
import { TestimonialsSection } from '@/lib/components/shared/landing/TestimonialsSection';
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


  return (
    <>
      <LandingHeader session={session} />

      <main>
        {/* Hero */}
        <HeroSection onAuthClick={() => router.push('/register')} />

        {/* Features grid */}
        <MethodSection />

        {/* How it works */}
        <AboutSection />

        {/* Comparison table */}
        <SubjectsSection />

        {/* Migration / switching */}
        <MigrationSection />

        {/* Pricing */}
        <MarqueeStrip onAuthClick={() => router.push('/register')} />

        {/* Testimonials (hidden when empty) */}
        <TestimonialsSection />

        <FooterSection />
      </main>
    </>
  );
}
