'use client';

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText as GSAPSplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

type SplitType = 'chars' | 'words' | 'lines' | 'words, chars';
type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type SplitTextTag = HeadingTag | 'p' | 'span' | 'div';

interface SplitTextProps {
  /** Plain-text content. Pass `children` instead when you need inline markup. */
  text?: string;
  /** Rich content. Nested spans (e.g. an accent-colored name) keep their styling — chars inherit color from ancestors. */
  children?: ReactNode;
  className?: string;
  /** Stagger between letter/word animations, in ms. */
  delay?: number;
  /** Per-letter animation duration, in seconds. */
  duration?: number;
  ease?: string;
  splitType?: SplitType;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  /** Intersection threshold (0–1) that triggers the reveal. */
  threshold?: number;
  /** ScrollTrigger rootMargin-style offset, e.g. "-100px". */
  rootMargin?: string;
  textAlign?: CSSProperties['textAlign'];
  tag?: SplitTextTag;
  onLetterAnimationComplete?: () => void;
}

type ElementWithSplit = HTMLElement & { _rbsplitInstance?: GSAPSplitText | null };

export function SplitText({
  text,
  children,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(
    () => typeof document !== 'undefined' && document.fonts?.status === 'loaded',
  );

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

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
      if (!el || (!text && !children) || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      if (el._rbsplitInstance) {
        try {
          el._rbsplitInstance.revert();
        } catch {
          /* noop */
        }
        el._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self) => {
          let targets: Element[] | null = null;
          if (splitType.includes('chars') && self.chars.length) targets = self.chars;
          if (!targets && splitType.includes('words') && self.words.length) targets = self.words;
          if (!targets && splitType.includes('lines') && self.lines.length) targets = self.lines;
          if (!targets) targets = self.chars || self.words || self.lines;

          return gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },
              onComplete: () => {
                animationCompletedRef.current = true;
                onCompleteRef.current?.();
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
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
      ],
      scope: ref,
    },
  );

  const style: CSSProperties = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
  };

  const Tag = (tag || 'p') as ElementType;
  return (
    <Tag ref={ref} style={style} className={`split-parent ${className}`}>
      {children ?? text}
    </Tag>
  );
}

export default SplitText;
