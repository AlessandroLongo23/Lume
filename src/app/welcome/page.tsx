'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';

const FADE_DURATION = 0.5;     // seconds
const DISPLAY_DURATION = 3000; // ms the message stays fully visible after fading in

function hi(name: string) {
  return (
    <>
      Benvenuto in Lume,{' '}
      <span className="text-primary font-semibold">{name}</span>.
    </>
  );
}

function workspace(salon: string) {
  return (
    <>
      Stiamo creando lo spazio di lavoro di{' '}
      <span className="text-primary font-semibold">{salon}</span>...
    </>
  );
}

const FALLBACK_MESSAGES: React.ReactNode[] = [
  'Benvenuto in Lume.',
  'Stiamo creando il tuo spazio di lavoro...',
  'Configurazione del calendario in corso...',
  'Tutto pronto. Iniziamo.',
];

function buildMessages(name: string, salon: string): React.ReactNode[] {
  return [
    name  ? hi(name)          : FALLBACK_MESSAGES[0],
    salon ? workspace(salon)  : FALLBACK_MESSAGES[1],
    'Configurazione del calendario in corso...',
    'Tutto pronto. Iniziamo.',
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
        <motion.p
          key={index}
          className="text-2xl font-light tracking-wide text-zinc-800 dark:text-zinc-200 text-center px-8 select-none"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: FADE_DURATION, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {messages[index]}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export default function WelcomePage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-zinc-950">
      <div className="absolute top-6 left-8">
        <LumeLogo size="md" />
      </div>
      <Suspense>
        <WelcomeSequence />
      </Suspense>
    </div>
  );
}
