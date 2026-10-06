import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Card } from './Card';
import { Cursor } from './Cursor';
import { cameraAt } from './camera';
import { theme } from './theme';
import type { Timeline } from './timeline';

export const INTRO_FRAMES = 84;
export const OUTRO_FRAMES = 84;
const FADE = 12;

export interface TutorialProps extends Record<string, unknown> {
  slug: string;
  timeline: Timeline | null;
}

export function Tutorial({ slug, timeline }: TutorialProps) {
  const { durationInFrames } = useVideoConfig();
  if (!timeline) return null;
  const main = durationInFrames - INTRO_FRAMES - OUTRO_FRAMES;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.paper, fontFamily: theme.fontFamily }}>
      {/* The cards cross-fade over the still head and tail of the recording. */}
      <Sequence from={INTRO_FRAMES - FADE} durationInFrames={main}>
        <Screen slug={slug} timeline={timeline} />
      </Sequence>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <Card title={timeline.title} subtitle={timeline.subtitle} fadeOut={FADE} />
      </Sequence>
      <Sequence from={INTRO_FRAMES + main - FADE * 2}>
        <Card title="Tutto qui." subtitle="Trovi le altre guide nella sezione Aiuto di Lume." fadeIn={FADE} />
      </Sequence>
    </AbsoluteFill>
  );
}

/** The recording of the guided tour, with the camera and the drawn cursor. */
function Screen({ slug, timeline }: { slug: string; timeline: Timeline }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = (frame / fps) * 1000;
  const k = width / timeline.viewport.width;
  const cam = cameraAt(timeline, t);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transformOrigin: '0 0',
          transform: `translate(${width / 2 - cam.x * k * cam.scale}px, ${height / 2 - cam.y * k * cam.scale}px) scale(${cam.scale})`,
        }}
      >
        <OffthreadVideo src={staticFile(`${slug}/raw.mp4`)} muted style={{ width, height }} />
        <Cursor timeline={timeline} t={t} k={k} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
