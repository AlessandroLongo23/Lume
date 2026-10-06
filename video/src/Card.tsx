import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { easeOut, theme } from './theme';

/** Full-frame title card used for the intro and the outro. */
export function Card({
  title,
  subtitle,
  fadeIn = 0,
  fadeOut = 0,
}: {
  title: string;
  subtitle: string;
  fadeIn?: number;
  fadeOut?: number;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = Math.min(
    fadeIn ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateRight: 'clamp' }) : 1,
    fadeOut ? interpolate(frame, [durationInFrames - fadeOut, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' }) : 1,
  );
  const rise = (delay: number) => {
    const p = interpolate(frame, [fadeIn + delay, fadeIn + delay + 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: easeOut,
    });
    return { opacity: p, transform: `translateY(${(1 - p) * 14}px)` };
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.paper,
        opacity,
        justifyContent: 'center',
        padding: '0 200px',
        color: theme.ink,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', ...rise(2) }}>
        {/* Same mark as LumeLogo.tsx: lucide's Lightbulb. */}
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={theme.indigo} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
          <path d="M9 18h6" />
          <path d="M10 22h4" />
        </svg>
        <span>
          Lume<span style={{ color: theme.indigo }}>.</span>
        </span>
      </div>
      <div style={{ marginTop: 56, fontSize: 104, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.08, ...rise(6) }}>{title}</div>
      <div style={{ marginTop: 28, fontSize: 40, lineHeight: 1.4, color: theme.inkSecondary, maxWidth: 1200, ...rise(11) }}>{subtitle}</div>
    </AbsoluteFill>
  );
}
