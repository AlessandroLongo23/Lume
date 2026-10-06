'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play } from 'lucide-react';
import { Button } from '@/lib/components/shared/ui/Button';
import { Tooltip } from '@/lib/components/shared/ui/Tooltip';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const BUCKET = 'tutorials';
const SPEEDS = [1, 1.25, 1.5, 2];
const SEEK_SECONDS = 5;

const clock = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * A tutorial's video, played from the public `tutorials` bucket in Supabase
 * Storage. `videoPath` is the file's path inside the bucket
 * (`<slug>/video.mp4`); its poster frame sits next to it as `poster.jpg`. Both
 * are produced and uploaded by the pipeline in `video/`.
 *
 * The controls sit in a bar UNDER the picture, never over it: these are screen
 * recordings, and the bottom edge is where the app's own buttons are. The bar
 * is always there, so nothing has to be hovered to be found. The videos have
 * no sound, so there is no volume and nothing to caption.
 *
 * Keyboard, with focus anywhere in the player: Space or K plays and pauses,
 * the arrows move five seconds, F toggles full screen.
 */
export function TutorialVideo({ videoPath, title }: { videoPath: string; title: string }) {
  const storage = supabase.storage.from(BUCKET);
  const src = storage.getPublicUrl(videoPath).data.publicUrl;
  const poster = storage.getPublicUrl(videoPath.replace(/[^/]+$/, 'poster.jpg')).data.publicUrl;

  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }, []);

  const seek = useCallback((to: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(video.duration, Math.max(0, to));
    setTime(video.currentTime);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen();
  }, []);

  const nextSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // The scrubber and the buttons handle their own keys.
    if (e.target !== e.currentTarget && e.key !== 'f' && e.key !== 'k') return;
    if (e.key === ' ' || e.key === 'k') toggle();
    else if (e.key === 'ArrowRight') seek(time + SEEK_SECONDS);
    else if (e.key === 'ArrowLeft') seek(time - SEEK_SECONDS);
    else if (e.key === 'f') toggleFullscreen();
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={frameRef}
      role="group"
      aria-label={`Video: ${title}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-xl border border-[var(--lume-border)] bg-[var(--lume-surface-raised)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]',
        fullscreen && 'rounded-none border-0',
      )}
    >
      <div className={cn('relative w-full', fullscreen ? 'min-h-0 flex-1' : 'aspect-video')}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="none"
          playsInline
          onClick={toggle}
          onPlay={() => {
            setPlaying(true);
            setStarted(true);
          }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          className="size-full cursor-pointer bg-[var(--lume-surface)] object-contain"
        />
        {/* Before the first play, one obvious way in. It sits to the right,
            clear of the title on the poster, which is set on the left. */}
        {!started && (
          <button
            type="button"
            onClick={toggle}
            aria-label="Riproduci il video"
            className="absolute inset-0 flex items-center justify-end pr-[18%] focus-visible:outline-none"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-[var(--lume-button-accent-bg)] text-[var(--lume-button-accent-fg)] shadow-md transition-colors duration-[var(--duration-base)] hover:bg-[var(--lume-button-accent-bg-hover)]">
              <Play className="ml-1 size-7" fill="currentColor" />
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--lume-border)] px-2 py-1.5">
        <Tooltip label={playing ? 'Pausa' : 'Riproduci'}>
          <Button
            variant="ghost"
            iconOnly
            leadingIcon={playing ? Pause : Play}
            aria-label={playing ? 'Pausa' : 'Riproduci'}
            onClick={toggle}
          />
        </Tooltip>

        <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--lume-text-secondary)]">
          {clock(time)} / {clock(duration)}
        </span>

        <Scrubber time={time} duration={duration} onSeek={seek} />

        <Tooltip label="Velocità">
          <Button
            variant="ghost"
            aria-label={`Velocità ${speed}×, cambia`}
            onClick={nextSpeed}
            className="w-14 shrink-0 font-mono tabular-nums"
          >
            {speed}×
          </Button>
        </Tooltip>

        <Tooltip label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'}>
          <Button
            variant="ghost"
            iconOnly
            leadingIcon={fullscreen ? Minimize : Maximize}
            aria-label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
            onClick={toggleFullscreen}
          />
        </Tooltip>
      </div>
    </div>
  );
}

/** The timeline: click or drag to move through the video, arrows when focused. */
function Scrubber({
  time,
  duration,
  onSeek,
}: {
  time: number;
  duration: number;
  onSeek: (to: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ready = duration > 0;
  const progress = ready ? Math.min(1, time / duration) : 0;

  const seekToPointer = (clientX: number) => {
    const track = trackRef.current;
    if (!track || !ready) return;
    const box = track.getBoundingClientRect();
    onSeek(((clientX - box.left) / box.width) * duration);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label="Avanzamento del video"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${clock(time)} di ${clock(duration)}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        seekToPointer(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekToPointer(e.clientX);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(time + SEEK_SECONDS);
        else if (e.key === 'ArrowLeft') onSeek(time - SEEK_SECONDS);
        else if (e.key === 'Home') onSeek(0);
        else if (e.key === 'End') onSeek(duration);
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
      // Tall hit area around a thin line, so it is easy to grab.
      className="group flex h-[var(--lume-control-h-md)] min-w-0 flex-1 cursor-pointer touch-none items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lume-ring-focus)]"
    >
      <div className="relative h-1 w-full rounded-full bg-[var(--lume-border)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--lume-accent)]"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--lume-accent)] opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
