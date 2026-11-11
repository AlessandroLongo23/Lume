'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

interface SplitTextProps {
  /** One line of text; nested spans (an accent-coloured name) keep their styling. */
  children: ReactNode;
  className?: string;
}

type ElementWithSplit = HTMLElement & { _rbsplitInstance?: GSAPSplitText | null };

// One reveal for the welcome and onboarding greetings: letters rise 14px and
// fade in, 22ms apart, as soon as the line enters the viewport.
const FROM = { opacity: 0, y: 14 };
const TO = { opacity: 1, y: 0 };
const STAGGER_S = 0.022;
const DURATION_S = 0.55;

/** A centred paragraph that reveals letter by letter (GSAP SplitText). */
export function SplitText({ children, className = '' }: SplitTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const animationCompletedRef = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(
    () => typeof document !== 'undefined' && document.fonts?.status === 'loaded',
  );

  useEffect(() => {
    if (fontsLoaded || typeof document === 'undefined') return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFontsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fontsLoaded]);

  useGSAP(
    () => {
      const el = ref.current as ElementWithSplit | null;
      if (!el || !children || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch {
          /* noop */
        }
        el._rbsplitInstance = null;
      }

      const splitInstance = new GSAPSplitText(el, {
        type: 'chars',
        smartWrap: true,
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self) => {
          return gsap.fromTo(
            self.chars,
            FROM,
            {
              ...TO,
              duration: DURATION_S,
              ease: 'power3.out',
              stagger: STAGGER_S,
              scrollTrigger: {
                trigger: el,
                start: 'top 100%',
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },
              onComplete: () => {
                animationCompletedRef.current = true;
              },
              willChange: 'transform, opacity',
              force3D: true,
            },
          );
        },
      });

      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
        try {
          splitInstance.revert();
        } catch {
          /* noop */
        }
        el._rbsplitInstance = null;
      };
    },
    {
      // Not `children`: callers remount (a new `key`) to play a new line.
      dependencies: [fontsLoaded],
      scope: ref,
    },
  );

  const style: CSSProperties = {
    textAlign: 'center',
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
  };

  return (
    <p ref={ref} style={style} className={`split-parent ${className}`}>
      {children}
    </p>
  );
}

export default SplitText;
