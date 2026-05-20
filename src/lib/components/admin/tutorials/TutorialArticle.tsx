'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Loader2 } from 'lucide-react';
import { ArticleImage, ImageLightbox, type LightboxImage } from './ImageLightbox';

/**
 * Renders a tutorial's article body. Content is authored as Markdown and served
 * as a static asset at `public/tutorials/<slug>/article.md` (alongside its
 * screenshots), so updating an article never needs a rebuild and the skill only
 * writes to `public/`. Screenshots are referenced with absolute paths
 * (`/tutorials/<slug>/NN-name.png`).
 *
 * Rendered with react-markdown + GFM, sanitized as defence-in-depth. A missing
 * file falls back to the quiet "coming soon" placeholder.
 */
const baseComponents: Components = {
  h1: ({ children }) => <h2 className="mt-8 mb-3 text-lg font-semibold text-foreground">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-8 mb-3 text-base font-semibold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 mb-2 text-sm font-semibold text-foreground">{children}</h3>,
  p: ({ children }) => <p className="my-3 text-sm leading-relaxed text-muted-foreground">{children}</p>,
  ul: ({ children }) => <ul className="my-3 flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] text-foreground dark:bg-zinc-800">
      {children}
    </code>
  ),
};

export function TutorialArticle({ slug }: { slug: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [zoomed, setZoomed] = useState<LightboxImage | null>(null);

  // Screenshots are static, pre-sized assets in /public, so next/image adds no
  // value; ArticleImage renders a plain <img> that expands into the lightbox.
  const components = useMemo<Components>(
    () => ({
      ...baseComponents,
      img: ({ src, alt }) => {
        const url = typeof src === 'string' ? src : undefined;
        if (!url) return null;
        return <ArticleImage src={url} alt={alt ?? ''} onOpen={() => setZoomed({ src: url, alt: alt ?? '' })} />;
      },
    }),
    [],
  );

  const closeZoom = useCallback(() => setZoomed(null), []);

  useEffect(() => {
    // State starts at 'loading'; the parent remounts via `key={slug}` so a slug
    // change gets a fresh load without a synchronous setState in the effect body.
    let alive = true;
    fetch(`/tutorials/${slug}/article.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('not found'))))
      .then((text) => {
        if (!alive) return;
        setContent(text);
        setState('ready');
      })
      .catch(() => {
        if (alive) setState('missing');
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carico la guida…
      </div>
    );
  }

  if (state === 'missing' || !content) {
    return (
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
        L’articolo con le istruzioni passo passo arriverà presto. Nel frattempo puoi seguire la guida
        interattiva qui sopra.
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {content}
      </ReactMarkdown>
      <ImageLightbox image={zoomed} onClose={closeZoom} />
    </div>
  );
}
