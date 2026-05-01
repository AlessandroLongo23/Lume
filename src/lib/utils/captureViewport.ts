'use client';

import { toCanvas } from 'html-to-image';

const WEBP_QUALITY = 0.85;
const MAX_LONG_EDGE = 2048;

/**
 * Captures the current page as a WebP Blob.
 *
 * Any element marked with the `data-capture-hide` attribute is hidden during
 * capture (a CSS rule on `[data-capture-hide="true"]` flips visibility), and
 * also filtered out of the rendered tree so it leaves no residue. Callers who
 * want extra elements hidden should set the attribute imperatively before
 * invoking and let the util manage the "true"/"" toggling.
 */
export async function captureViewport(): Promise<Blob> {
  const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-capture-hide]'));
  targets.forEach((el) => el.setAttribute('data-capture-hide', 'true'));

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  try {
    const sourceCanvas = await toCanvas(document.body, {
      pixelRatio: 1,
      cacheBust: true,
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        return node.dataset.captureHide !== 'true';
      },
    });

    const canvas = downscaleCanvas(sourceCanvas, MAX_LONG_EDGE);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY),
    );
    if (!blob) throw new Error('Cattura schermo non riuscita');
    return blob;
  } finally {
    targets.forEach((el) => el.setAttribute('data-capture-hide', ''));
  }
}

function downscaleCanvas(source: HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  const longest = Math.max(source.width, source.height);
  if (longest <= maxEdge) return source;
  const scale = maxEdge / longest;
  const targetW = Math.round(source.width * scale);
  const targetH = Math.round(source.height * scale);
  const target = document.createElement('canvas');
  target.width = targetW;
  target.height = targetH;
  const ctx = target.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, targetW, targetH);
  return target;
}
