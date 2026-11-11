'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { SplitText } from '@/lib/components/shared/ui/SplitText';
import { EASE_OUT } from '@/lib/const/motion';

const FADE_DURATION = 0.5;
const DISPLAY_DURATION = 3000;

function hi(name: string) {
  return (
    <>
      Benvenuto in Lume,{' '}
      <span className="text-[var(--lume-text)] font-medium">{name}</span>.
    </>
  );
}

function workspace(salon: string) {
  return (
    <>
      Stiamo creando lo spazio di lavoro di{' '}
      <span className="text-[var(--lume-text)] font-medium">{salon}</span>...
    </>
  );
}

const FALLBACK_MESSAGES: React.ReactNode[] = [
  'Benvenuto in Lume.',
  'Stiamo creando il tuo spazio di lavoro...',
  'Configurazione del calendario in corso...',
  'Ci siamo quasi...',
];

function buildMessages(name: string, salon: string): React.ReactNode[] {
  return [
    name  ? hi(name)          : FALLBACK_MESSAGES[0],
    salon ? workspace(salon)  : FALLBACK_MESSAGES[1],
    'Configurazione del calendario in corso...',
    'Ci siamo quasi...',
  ];
}

function WelcomeSequence() {
  const router = useRouter();
  const params = useSearchParams();
  const name  = params.get('name')  ?? '';
  const salon = params.get('salon') ?? '';

  const messages = buildMessages(name, salon);

  const [index, setIndex]   = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(
      () => setVisible(false),
      FADE_DURATION * 1000 + DISPLAY_DURATION,
    );
    return () => clearTimeout(timer);
  }, [index]);

  function handleExitComplete() {
    if (index < messages.length - 1) {
      setIndex(i => i + 1);
      setVisible(true);
    } else {
      router.push('/onboarding/import');
    }
  }

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          key={index}
          className="px-8 select-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: FADE_DURATION, ease: EASE_OUT }}
        >
          <SplitText
            className="text-2xl font-light tracking-tight text-[var(--lume-text-secondary)]"
          >
            {messages[index]}
          </SplitText>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function WelcomePage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--lume-bg)]">
      <div className="absolute top-6 left-8">
        <LumeLogo size="md" />
      </div>
      <Suspense>
        <WelcomeSequence />
      </Suspense>
    </div>
  );
}
