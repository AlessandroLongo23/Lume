import { Composition, staticFile, type CalculateMetadataFunction } from 'remotion';
import { INTRO_FRAMES, OUTRO_FRAMES, Tutorial, type TutorialProps } from './Tutorial';
import { FRAME } from './layout';
import type { Timeline } from './timeline';

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<TutorialProps> = async ({ props }) => {
  const res = await fetch(staticFile(`${props.slug}/timeline.json`));
  const timeline = (await res.json()) as Timeline;
  const main = Math.ceil((timeline.durationMs / 1000) * FPS);
  return {
    durationInFrames: INTRO_FRAMES + main + OUTRO_FRAMES,
    props: { ...props, timeline },
  };
};

export function Root() {
  return (
    <Composition
      id="Tutorial"
      component={Tutorial}
      width={FRAME.width}
      height={FRAME.height}
      fps={FPS}
      durationInFrames={FPS}
      defaultProps={{ slug: 'crea-cliente', timeline: null }}
      calculateMetadata={calculateMetadata}
    />
  );
}
