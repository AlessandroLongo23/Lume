'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ImageLightbox } from './ImageLightbox';

const BUCKET = 'feedback-attachments';

interface ImageGalleryProps {
  paths: string[];
  className?: string;
}

export function ImageGallery({ paths, className = '' }: ImageGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const urls = useMemo(
    () => paths.map((p) => supabase.storage.from(BUCKET).getPublicUrl(p).data.publicUrl),
    [paths],
  );

  if (paths.length === 0) return null;

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
        {urls.map((url, i) => (
          <button
            key={paths[i]}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative aspect-square rounded-lg overflow-hidden border border-zinc-500/25 bg-zinc-100 dark:bg-zinc-800 hover:border-primary/50 transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              loading="lazy"
              className="size-full object-cover group-hover:opacity-95 transition-opacity"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <ImageLightbox
          urls={urls}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}
