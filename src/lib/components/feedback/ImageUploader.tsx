'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

const BUCKET = 'feedback-attachments';
const MAX_IMAGES = 4;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_LONG_EDGE = 2048;
const WEBP_QUALITY = 0.85;
const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface ImageUploaderProps {
  kind: 'feedback' | 'comments';
  paths: string[];
  onChange: (paths: string[]) => void;
  disabled?: boolean;
}

type PreviewMap = Record<string, string>;

export function ImageUploader({ kind, paths, onChange, disabled = false }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<PreviewMap>({});

  const remaining = MAX_IMAGES - paths.length;

  const handlePick = () => {
    if (disabled || isUploading || remaining <= 0) return;
    inputRef.current?.click();
  };

  const handleFiles = async (files: FileList) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        messagePopup.getState().error('Devi essere autenticato per caricare immagini.');
        return;
      }

      const queue = Array.from(files).slice(0, remaining);
      const newPaths: string[] = [];
      const nextPreviews: PreviewMap = { ...previews };

      for (const raw of queue) {
        if (!ACCEPTED_MIMES.includes(raw.type)) {
          messagePopup.getState().error(`Formato non supportato: ${raw.name}. Usa JPEG, PNG, WebP o GIF.`);
          continue;
        }
        if (raw.size > MAX_SIZE_BYTES * 3) {
          // Safety cap on the raw input: we downscale below, but reject wildly huge files early.
          messagePopup.getState().error(`${raw.name} è troppo grande. Limite: 15 MB.`);
          continue;
        }

        let blob: Blob = raw;
        let ext = extensionFor(raw.type);

        // GIFs skip the canvas re-encode to preserve animation.
        if (raw.type !== 'image/gif') {
          try {
            blob = await downscaleImage(raw);
            ext = 'webp';
          } catch {
            // Fall back to the original if canvas resize fails (rare — older browsers).
            blob = raw;
          }
        }

        if (blob.size > MAX_SIZE_BYTES) {
          messagePopup.getState().error(`${raw.name} supera ancora il limite di 5 MB dopo la compressione.`);
          continue;
        }

        const path = `${kind}/${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: blob.type || raw.type });
        if (error) {
          messagePopup.getState().error(`Errore caricamento ${raw.name}: ${error.message}`);
          continue;
        }
        newPaths.push(path);
        nextPreviews[path] = URL.createObjectURL(blob);
      }

      if (newPaths.length > 0) {
        setPreviews(nextPreviews);
        onChange([...paths, ...newPaths]);
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (path: string) => {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      messagePopup.getState().error('Impossibile rimuovere l\'immagine: ' + error.message);
      return;
    }
    if (previews[path]) URL.revokeObjectURL(previews[path]);
    const nextPreviews = { ...previews };
    delete nextPreviews[path];
    setPreviews(nextPreviews);
    onChange(paths.filter((p) => p !== path));
  };

  const publicUrlFor = (path: string) =>
    previews[path] ?? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIMES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
      />

      <div className="flex flex-row flex-wrap items-center gap-2">
        {paths.map((path) => (
          <div
            key={path}
            className="relative size-20 rounded-lg overflow-hidden border border-zinc-500/25 bg-zinc-100 dark:bg-zinc-800"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicUrlFor(path)} alt="" className="size-full object-cover" />
            {!disabled && (
              <button
                type="button"
                aria-label="Rimuovi immagine"
                onClick={() => handleRemove(path)}
                className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))}

        {remaining > 0 && !disabled && (
          <button
            type="button"
            onClick={handlePick}
            disabled={isUploading}
            className="flex flex-col items-center justify-center gap-1 size-20 rounded-lg border border-dashed border-zinc-500/40 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-500/70 transition-colors disabled:opacity-40"
          >
            {isUploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-[10px]">{isUploading ? 'Carico…' : `${paths.length}/${MAX_IMAGES}`}</span>
          </button>
        )}
      </div>

      {paths.length === 0 && !disabled && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Fino a {MAX_IMAGES} immagini · JPEG, PNG, WebP o GIF · max 5 MB ciascuna
        </p>
      )}
    </div>
  );
}

function extensionFor(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/gif': return 'gif';
    default: return 'bin';
  }
}

async function downscaleImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas: HTMLCanvasElement | OffscreenCanvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement('canvas'), { width: targetW, height: targetH });

  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error('Canvas 2D non disponibile');
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  if (canvas instanceof OffscreenCanvas) {
    return await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
  }
  return await new Promise<Blob>((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      (b) => b ? resolve(b) : reject(new Error('toBlob failed')),
      'image/webp',
      WEBP_QUALITY,
    );
  });
}
